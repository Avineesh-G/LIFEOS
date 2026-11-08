import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getData, saveData, sanitizeAppData, migrateAppData, clearAllData, DEFAULT_DATA } from '../db';
import type { AppData } from '../types';
import { User } from 'firebase/auth';
import { scheduleWidgetSync } from '../utils/widgetBridge';
import { Preferences } from '@capacitor/preferences';
import { clearAllReceiptBlobs, clearAllOutingsData } from '../features/outings/storage/outingsIdb';
import { registerPlugin, Capacitor } from '@capacitor/core';

const SyncManager = registerPlugin<any>('SyncManager');

const CACHE_KEY_PREFIX = 'lifeos_cache_';

export function useData(user: User | null) {
  // Track the UID of the user account that current in-memory 'data' belongs to
  const activeUidRef = useRef<string | null>(user?.uid || null);

  const [data, setData] = useState<AppData>(() => {
    // Purge legacy unscoped cache if present
    try {
      localStorage.removeItem('lifeos_cached_app_data');
    } catch {}

    const uid = user?.uid;
    if (uid) {
      try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + uid);
        if (cached) {
          const parsed = migrateAppData(JSON.parse(cached));
          // Validate tenant ownership
          if ((parsed as any)._ownerUid && (parsed as any)._ownerUid !== uid) {
            console.warn('[LifeOS Tenant Isolation] Cache ownership mismatch on init, using clean DEFAULT_DATA');
            return DEFAULT_DATA;
          }
          return { ...parsed, _ownerUid: uid };
        }
      } catch {
        // ignore parsing error
      }
    }
    return DEFAULT_DATA;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to current data to avoid stale closures in optimistic updates
  const dataRef = useRef<AppData>(data);

  // Tenant-isolated cache persistence: strictly write to cache ONLY if data belongs to active user
  useEffect(() => {
    dataRef.current = data;
    if (user && user.uid && activeUidRef.current === user.uid) {
      const ownerUid = (data as any)._ownerUid;
      if (!ownerUid || ownerUid === user.uid) {
        try {
          const dataWithOwner = { ...data, _ownerUid: user.uid };
          localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(dataWithOwner));
        } catch {
          // quota exceeded or private mode
        }
      } else {
        console.warn('[LifeOS Tenant Isolation] Refused to cache data belonging to another user:', ownerUid);
      }
    }
  }, [data, user]);

  // Tenant switch handler: immediately purge and re-hydrate whenever user account changes
  useEffect(() => {
    const currentUid = user?.uid || null;
    if (activeUidRef.current !== currentUid) {
      console.log('[LifeOS Tenant Isolation] Auth user transitioned from', activeUidRef.current, 'to', currentUid);
      activeUidRef.current = currentUid;

      if (!currentUid) {
        // User logged out: immediately reset in-memory state to clean DEFAULT_DATA
        setData(DEFAULT_DATA);
        dataRef.current = DEFAULT_DATA;
        setLoading(false);
        setError(null);
        return;
      }

      // User logged in / switched: hydrate strictly from this user's private cache
      try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + currentUid);
        if (cached) {
          const parsed = migrateAppData(JSON.parse(cached));
          if ((parsed as any)._ownerUid && (parsed as any)._ownerUid !== currentUid) {
            console.warn('[LifeOS Tenant Isolation] Cache ownership mismatch on account switch, resetting to clean DEFAULT_DATA');
            setData(DEFAULT_DATA);
            dataRef.current = DEFAULT_DATA;
          } else {
            const parsedWithOwner = { ...parsed, _ownerUid: currentUid };
            setData(parsedWithOwner);
            dataRef.current = parsedWithOwner;
          }
          setLoading(false);
        } else {
          setData(DEFAULT_DATA);
          dataRef.current = DEFAULT_DATA;
          setLoading(true);
        }
      } catch {
        setData(DEFAULT_DATA);
        dataRef.current = DEFAULT_DATA;
        setLoading(true);
      }
      setError(null);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const currentUid = user.uid;
    setError(null);

    // 2. Attach real-time Firestore synchronization listener
    const docRef = doc(db, 'users', currentUid);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // Guard: If user changed while snapshot was in-flight, discard immediately!
        if (activeUidRef.current !== currentUid) {
          console.warn('[LifeOS Tenant Isolation] Dropped in-flight snapshot for old user:', currentUid);
          return;
        }

        if (snapshot.exists()) {
          const serverData = snapshot.data() as Partial<AppData>;
          const fresh = migrateAppData(serverData);

          // Auto-healing protection: ONLY preserve local progress if the cache explicitly belongs to THIS user
          try {
            const cachedRaw = localStorage.getItem(CACHE_KEY_PREFIX + currentUid);
            if (cachedRaw) {
              const localData = JSON.parse(cachedRaw);
              // Strict verification: ensure local cache belongs to currentUid
              if (localData && typeof localData === 'object' && (!localData._ownerUid || localData._ownerUid === currentUid)) {
                let needsCloudRestore = false;
                const recoveryPatch: Partial<AppData> = {};

                // 1. Tasks: preserve any newly added tasks AND any locally completed / opted signs!
                if (Array.isArray(localData.tasks)) {
                  const serverTasks = Array.isArray(fresh.tasks) ? fresh.tasks : [];
                  let tasksChanged = false;

                  const serverIds = new Set(serverTasks.map((t: any) => t.id));
                  const localOnlyTasks = localData.tasks.filter((t: any) => !serverIds.has(t.id));

                  const mergedTasks = serverTasks.map((st: any) => {
                    const lt = localData.tasks.find((t: any) => t.id === st.id);
                    if (lt && lt.completed && !st.completed) {
                      tasksChanged = true;
                      return { ...st, completed: true, date: lt.date, dueDate: lt.dueDate };
                    }
                    return st;
                  });

                  if (localOnlyTasks.length > 0 || tasksChanged) {
                    fresh.tasks = [...mergedTasks, ...localOnlyTasks];
                    recoveryPatch.tasks = fresh.tasks;
                    needsCloudRestore = true;
                  }
                }

                // 2. Shopping Lists: preserve new lists AND opted signs (checked items)
                if (Array.isArray(localData.shoppingLists)) {
                  const serverLists = Array.isArray(fresh.shoppingLists) ? fresh.shoppingLists : [];
                  let shoppingChanged = false;
                  const serverListIds = new Set(serverLists.map((l: any) => l.id));
                  const localOnlyLists = localData.shoppingLists.filter((l: any) => !serverListIds.has(l.id));

                  const mergedLists = serverLists.map((sList: any) => {
                    const lList = localData.shoppingLists.find((l: any) => l.id === sList.id);
                    if (!lList || !Array.isArray(lList.items)) return sList;

                    const serverItemIds = new Set((sList.items || []).map((it: any) => it.id));
                    const localOnlyItems = (lList.items || []).filter((it: any) => !serverItemIds.has(it.id));

                    const mergedItems = (sList.items || []).map((sItem: any) => {
                      const lItem = lList.items.find((it: any) => it.id === sItem.id);
                      if (lItem && lItem.checked && !sItem.checked) {
                        shoppingChanged = true;
                        return { ...sItem, checked: true };
                      }
                      return sItem;
                    });

                    if (localOnlyItems.length > 0) shoppingChanged = true;
                    return {
                      ...sList,
                      items: [...mergedItems, ...localOnlyItems],
                    };
                  });

                  if (localOnlyLists.length > 0 || shoppingChanged) {
                    fresh.shoppingLists = [...mergedLists, ...localOnlyLists];
                    recoveryPatch.shoppingLists = fresh.shoppingLists;
                    needsCloudRestore = true;
                  }
                }

                // 3. Workout Logs: preserve completed sets (opted signs) and any offline logs
                if (Array.isArray(localData.workoutLogs)) {
                  const serverLogs = Array.isArray(fresh.workoutLogs) ? fresh.workoutLogs : [];
                  let workoutChanged = false;
                  const serverLogDates = new Set(serverLogs.map((w: any) => w.date));
                  const localOnlyLogs = localData.workoutLogs.filter((w: any) => !serverLogDates.has(w.date));

                  const mergedWorkoutLogs = serverLogs.map((sLog: any) => {
                    const lLog = localData.workoutLogs.find((w: any) => w.date === sLog.date);
                    if (!lLog || !Array.isArray(lLog.exercises)) return sLog;

                    const localCompletedSets = (lLog.exercises || []).reduce(
                      (sum: number, ex: any) => sum + (ex.sets || []).filter((s: any) => s.completed).length,
                      0
                    );
                    const serverCompletedSets = (sLog.exercises || []).reduce(
                      (sum: number, ex: any) => sum + (ex.sets || []).filter((s: any) => s.completed).length,
                      0
                    );
                    if (localCompletedSets > serverCompletedSets) {
                      workoutChanged = true;
                      return lLog;
                    }
                    return sLog;
                  });

                  if (localOnlyLogs.length > 0 || workoutChanged) {
                    fresh.workoutLogs = [...mergedWorkoutLogs, ...localOnlyLogs];
                    recoveryPatch.workoutLogs = fresh.workoutLogs;
                    needsCloudRestore = true;
                  }
                }

                // 4. Notes: preserve any notes created offline or edited locally
                if (Array.isArray(localData.notes)) {
                  const serverNotes = Array.isArray(fresh.notes) ? fresh.notes : [];
                  const serverNoteIds = new Set(serverNotes.map((n: any) => n.id));
                  const localOnlyNotes = localData.notes.filter((n: any) => !serverNoteIds.has(n.id));

                  if (localOnlyNotes.length > 0) {
                    fresh.notes = [...serverNotes, ...localOnlyNotes];
                    recoveryPatch.notes = fresh.notes;
                    needsCloudRestore = true;
                  }
                }

                // 5. Laundry batches
                if ((localData.laundryBatches?.length || 0) > (fresh.laundryBatches?.length || 0)) {
                  fresh.laundryBatches = localData.laundryBatches;
                  recoveryPatch.laundryBatches = localData.laundryBatches;
                  needsCloudRestore = true;
                }

                // 6. Vault items
                if ((localData.vaultItems?.length || 0) > (fresh.vaultItems?.length || 0)) {
                  fresh.vaultItems = localData.vaultItems;
                  recoveryPatch.vaultItems = localData.vaultItems;
                  needsCloudRestore = true;
                }

                // 7. Expenses
                if ((localData.expenses?.length || 0) > (fresh.expenses?.length || 0)) {
                  fresh.expenses = localData.expenses;
                  recoveryPatch.expenses = localData.expenses;
                  needsCloudRestore = true;
                }

                // 8. Timetable
                if ((localData.timetable?.length || 0) > (fresh.timetable?.length || 0)) {
                  fresh.timetable = localData.timetable;
                  recoveryPatch.timetable = localData.timetable;
                  needsCloudRestore = true;
                }

                // 9. Study sessions
                if ((localData.studySessions?.length || 0) > (fresh.studySessions?.length || 0)) {
                  fresh.studySessions = localData.studySessions;
                  recoveryPatch.studySessions = localData.studySessions;
                  needsCloudRestore = true;
                }

                // 10. Profile
                if (localData.profile && !fresh.profile) {
                  fresh.profile = localData.profile;
                  recoveryPatch.profile = localData.profile;
                  needsCloudRestore = true;
                }

                if (needsCloudRestore) {
                  console.log('[LifeOS Tenant Isolation] Auto-healing: Synchronizing local progress back to Firestore cloud', recoveryPatch);
                  saveData(currentUid, recoveryPatch).catch(err => console.error('Cloud restore error:', err));
                }
              }
            }
          } catch (e) {
            console.warn('Auto-healing check error:', e);
          }

          const freshWithOwner = { ...fresh, _ownerUid: currentUid };
          setData(freshWithOwner);
          dataRef.current = freshWithOwner;
          scheduleWidgetSync(freshWithOwner, 300);
          try {
            localStorage.setItem(CACHE_KEY_PREFIX + currentUid, JSON.stringify(freshWithOwner));
          } catch {}
          setLoading(false);
          setError(null);
        } else {
          // Document does not exist yet on server (brand new user)
          // Strictly clean user initialization: NEVER seed from previous users!
          const cleanInitialData: AppData = {
            ...DEFAULT_DATA,
            profile: {
              name: user.displayName || 'LifeOS User',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
            } as any,
          };
          (cleanInitialData as any)._ownerUid = currentUid;

          setData(cleanInitialData);
          dataRef.current = cleanInitialData;
          setLoading(false);
          try {
            localStorage.setItem(CACHE_KEY_PREFIX + currentUid, JSON.stringify(cleanInitialData));
          } catch {}
          // Auto-seed clean user document in Firestore cloud so subsequent saves merge seamlessly
          saveData(currentUid, cleanInitialData).catch(err => {
            console.warn('Initial clean cloud seed notice:', err);
          });
        }
      },
      (err) => {
        if (activeUidRef.current !== currentUid) return;
        console.warn('Real-time Firestore listener error, falling back to direct fetch:', err);
        setError(err.message || 'Sync error');
        getData(currentUid, false)
          .then((fresh) => {
            if (activeUidRef.current !== currentUid) return;
            const freshWithOwner = { ...fresh, _ownerUid: currentUid };
            setData(freshWithOwner);
            dataRef.current = freshWithOwner;
            setLoading(false);
          })
          .catch(() => {
            if (activeUidRef.current !== currentUid) return;
            if (!dataRef.current) {
              setData(DEFAULT_DATA);
              dataRef.current = DEFAULT_DATA;
            }
            setLoading(false);
          });
      }
    );

    return () => unsubscribe();
  }, [user]);

  // When internet connection is restored, immediately synchronize current phone storage state to Cloud Firestore
  useEffect(() => {
    if (!user) return;
    const currentUid = user.uid;
    const handleOnline = () => {
      console.log('[LifeOS Tenant Isolation] Online connection restored: syncing local phone data to cloud');
      if (dataRef.current && activeUidRef.current === currentUid) {
        saveData(currentUid, dataRef.current).then(() => {
          if (Capacitor.isNativePlatform()) {
            SyncManager.cancelBackgroundSync().catch(() => {});
          }
        }).catch(err => {
          console.error('[LifeOS] Cloud re-sync error on online event:', err);
        });
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  // Synchronous optimistic update: UI updates at 0ms latency!
  const updateData = useCallback(async (partial: Partial<AppData>): Promise<AppData> => {
    if (!user || activeUidRef.current !== user.uid) return DEFAULT_DATA;

    const current = dataRef.current || DEFAULT_DATA;
    const optimistic = sanitizeAppData({ ...current, ...partial });
    (optimistic as any)._ownerUid = user.uid;

    // 1. Instantly update React state
    setData(optimistic);
    dataRef.current = optimistic;

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(optimistic));
    } catch {
      // ignore
    }

    // 3. Save to Firestore in background without blocking caller
    saveData(user.uid, partial)
      .then(() => {
        if (Capacitor.isNativePlatform()) {
          SyncManager.cancelBackgroundSync().catch(() => {});
        }
      })
      .catch(err => {
        console.warn('Background Firestore sync error, enqueueing OS WorkManager background sync:', err);
        if (Capacitor.isNativePlatform()) {
          SyncManager.enqueueBackgroundSync().catch(() => {});
        }
      });

    // If offline when mutating data, preemptively enqueue background sync
    if (typeof navigator !== 'undefined' && !navigator.onLine && Capacitor.isNativePlatform()) {
      SyncManager.enqueueBackgroundSync().catch(() => {});
    }

    // 4. If tasks or study sessions changed, schedule non-blocking Android Home Screen Widget sync
    if (partial.tasks || partial.studySessions) {
      scheduleWidgetSync(optimistic, 150);
    }

    return optimistic;
  }, [user]);

  const refresh = useCallback(async (): Promise<AppData> => {
    if (!user || activeUidRef.current !== user.uid) return DEFAULT_DATA;
    try {
      const fresh = await getData(user.uid, true); // Force fetch from server
      if (activeUidRef.current !== user.uid) return dataRef.current;
      const freshWithOwner = { ...fresh, _ownerUid: user.uid };
      setData(freshWithOwner);
      dataRef.current = freshWithOwner;
      scheduleWidgetSync(freshWithOwner, 200);
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(freshWithOwner));
      } catch {}
      return freshWithOwner;
    } catch (err) {
      console.error('Force sync error:', err);
      return dataRef.current || DEFAULT_DATA;
    }
  }, [user]);

  // Permanent and total data reset: wipes Firestore document, clears localStorage, sessionStorage, and IndexedDB
  const resetAllData = useCallback(async (): Promise<void> => {
    if (!user || activeUidRef.current !== user.uid) return;
    const currentUid = user.uid;
    setData(DEFAULT_DATA);
    dataRef.current = DEFAULT_DATA;
    try {
      await clearAllData(currentUid);
    } catch (err) {
      console.error('[LifeOS] Error wiping Firestore user document:', err);
    }
    try {
      localStorage.removeItem(CACHE_KEY_PREFIX + currentUid);
    } catch {}
    try {
      localStorage.removeItem('lifeos_cached_app_data');
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
    try {
      await clearAllReceiptBlobs();
    } catch {}
    try {
      await clearAllOutingsData();
    } catch {}
    try {
      const dbs = await indexedDB.databases?.();
      if (dbs) {
        for (const d of dbs) {
          if (d.name && d.name !== 'firebaseLocalStorageDb') {
            indexedDB.deleteDatabase(d.name);
          }
        }
      }
    } catch {}
    try {
      await Preferences.clear();
    } catch {}
  }, [user]);

  return { data, loading, updateData, refresh, resetAllData, error };
}
