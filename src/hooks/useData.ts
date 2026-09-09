import { useEffect, useState, useCallback, useRef } from 'react';
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
    if (user) {
      // If we don't have cached data, set loading true
      if (!dataRef.current) {
        setLoading(true);
      }
      setError(null);

      const timeout = setTimeout(() => {
        if (!dataRef.current) {
          console.warn('Firestore took too long, loading with default data');
          const fallback = sanitizeAppData(DEFAULT_DATA);
          setData(fallback);
          setLoading(false);
        }
      }, 10000);

      getData(user.uid)
        .then((fresh) => {
          clearTimeout(timeout);
          setData(fresh);
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('Failed to fetch user data:', err);
          setError(err.message || 'Failed to load data');
          if (!dataRef.current) {
            setData(sanitizeAppData(DEFAULT_DATA));
          }
          setLoading(false);
        });

      return () => clearTimeout(timeout);
    } else {
      setData(null);
      setLoading(false);
    }
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
    const fresh = await getData(user.uid);
    setData(fresh);
    return fresh;
  }, [user]);

  return { data, loading, updateData, refresh, error };
}

