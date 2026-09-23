import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getData, saveData, sanitizeAppData, migrateAppData, DEFAULT_DATA } from '../db';
import type { AppData } from '../types';
import { User } from 'firebase/auth';
import { scheduleWidgetSync } from '../utils/widgetBridge';

const CACHE_KEY_PREFIX = 'lifeos_cache_';
const GLOBAL_CACHE_KEY = 'lifeos_cached_app_data';

export function useData(user: User | null) {
  const [data, setData] = useState<AppData>(() => {
    let uid = user?.uid;
    if (!uid) {
      try {
        const cachedUser = localStorage.getItem('lifeos_cached_auth_user');
        if (cachedUser) {
          uid = JSON.parse(cachedUser)?.uid;
        }
      } catch {}
    }
    if (uid) {
      try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + uid);
        if (cached) {
          return migrateAppData(JSON.parse(cached));
        }
      } catch {
        // ignore parsing error
      }
    }
    try {
      const globalCached = localStorage.getItem(GLOBAL_CACHE_KEY);
      if (globalCached) {
        return migrateAppData(JSON.parse(globalCached));
      }
    } catch {}
    return DEFAULT_DATA;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to current data to avoid stale closures in optimistic updates
  const dataRef = useRef<AppData>(data);
  useEffect(() => {
    dataRef.current = data;
    try {
      localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(data));
      if (user) {
        localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(data));
      }
    } catch {
      // quota exceeded or private mode
    }
  }, [data, user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Immediately hydrate from local storage for this user so UI never blocks
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + user.uid);
      if (cached) {
        const parsed = migrateAppData(JSON.parse(cached));
        setData(parsed);
        dataRef.current = parsed;
        setLoading(false);
      } else if (!dataRef.current) {
        setLoading(true);
      }
    } catch {
      if (!dataRef.current) setLoading(true);
    }
    setError(null);

    // 2. Attach real-time Firestore synchronization listener
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const serverData = snapshot.data() as Partial<AppData>;
          const fresh = migrateAppData(serverData);

          // Auto-healing protection: preserve local progress and opted signs if server is missing them or older
          try {
            const cachedRaw = localStorage.getItem(CACHE_KEY_PREFIX + user.uid);
            if (cachedRaw) {
              const localData = JSON.parse(cachedRaw);
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
                console.log('Auto-healing: Synchronizing local progress & opted signs back to Firestore cloud', recoveryPatch);
                saveData(user.uid, recoveryPatch).catch(err => console.error('Cloud restore error:', err));
              }
            }
          } catch (e) {
            console.warn('Auto-healing check error:', e);
          }

          setData(fresh);
          dataRef.current = fresh;
          scheduleWidgetSync(fresh, 300);
          try {
            localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(fresh));
          } catch {}
          setLoading(false);
          setError(null);
        } else {
          // Document does not exist yet on server (brand new user)
          const initial = dataRef.current || DEFAULT_DATA;
          setData(initial);
          dataRef.current = initial;
          setLoading(false);
          // Auto-seed initial user document in Firestore cloud so subsequent saves merge seamlessly
          saveData(user.uid, initial).catch(err => {
            console.warn('Initial cloud seed notice:', err);
          });
        }
      },
      (err) => {
        console.warn('Real-time Firestore listener error, falling back to direct fetch:', err);
        setError(err.message || 'Sync error');
        getData(user.uid, false)
          .then((fresh) => {
            setData(fresh);
            dataRef.current = fresh;
            setLoading(false);
          })
          .catch(() => {
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
    const handleOnline = () => {
      console.log('[LifeOS] Online connection restored: syncing local phone data to cloud');
      if (dataRef.current) {
        saveData(user.uid, dataRef.current).catch(err => {
          console.error('[LifeOS] Cloud re-sync error on online event:', err);
        });
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  // Synchronous optimistic update: UI updates at 0ms latency!
  const updateData = useCallback(async (partial: Partial<AppData>): Promise<AppData> => {
    if (!user) return DEFAULT_DATA;

    const current = dataRef.current || DEFAULT_DATA;
    const optimistic = sanitizeAppData({ ...current, ...partial });

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
    saveData(user.uid, partial).catch(err => {
      console.error('Background Firestore sync error:', err);
    });

    // 4. If tasks or study sessions changed, schedule non-blocking Android Home Screen Widget sync
    if (partial.tasks || partial.studySessions) {
      scheduleWidgetSync(optimistic, 150);
    }

    return optimistic;
  }, [user]);

  const refresh = useCallback(async (): Promise<AppData> => {
    if (!user) return DEFAULT_DATA;
    try {
      const fresh = await getData(user.uid, true); // Force fetch from server
      setData(fresh);
      dataRef.current = fresh;
      scheduleWidgetSync(fresh, 200);
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(fresh));
      } catch {}
      return fresh;
    } catch (err) {
      console.error('Force sync error:', err);
      return dataRef.current || DEFAULT_DATA;
    }
  }, [user]);

  return { data, loading, updateData, refresh, error };
}
