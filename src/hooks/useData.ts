import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getData, saveData, sanitizeAppData, DEFAULT_DATA } from '../db';
import type { AppData } from '../types';
import { User } from 'firebase/auth';

const CACHE_KEY_PREFIX = 'lifeos_cache_';

export function useData(user: User | null) {
  const [data, setData] = useState<AppData | null>(() => {
    if (!user) return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + user.uid);
      if (cached) {
        return sanitizeAppData(JSON.parse(cached));
      }
    } catch {
      // ignore parsing error
    }
    return null;
  });

  const [loading, setLoading] = useState(!data && !!user);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to current data to avoid stale closures in optimistic updates
  const dataRef = useRef<AppData | null>(data);
  useEffect(() => {
    dataRef.current = data;
    if (user && data) {
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(data));
      } catch {
        // quota exceeded or private mode
      }
    }
  }, [data, user]);

  useEffect(() => {
    if (!user) {
      setData(null);
      dataRef.current = null;
      setLoading(false);
      return;
    }

    // 1. Immediately hydrate from local storage for this user so UI never blocks
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + user.uid);
      if (cached) {
        const parsed = sanitizeAppData(JSON.parse(cached));
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
          const fresh = sanitizeAppData(snapshot.data() as Partial<AppData>);
          setData(fresh);
          dataRef.current = fresh;
          try {
            localStorage.setItem(CACHE_KEY_PREFIX + user.uid, JSON.stringify(fresh));
          } catch {}
          setLoading(false);
          setError(null);
        } else {
          // Document does not exist yet on server; seed initial structure
          if (!dataRef.current) {
            setData(DEFAULT_DATA);
            dataRef.current = DEFAULT_DATA;
          }
          setLoading(false);
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
    saveData(user.uid, partial, current).catch(err => {
      console.error('Background Firestore sync error:', err);
    });

    return optimistic;
  }, [user]);

  const refresh = useCallback(async (): Promise<AppData> => {
    if (!user) return DEFAULT_DATA;
    try {
      const fresh = await getData(user.uid, true); // Force fetch from server
      setData(fresh);
      dataRef.current = fresh;
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
