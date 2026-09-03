import { useEffect, useState, useCallback } from 'react';
import { getData, saveData, DEFAULT_DATA } from '../db';
import type { AppData } from '../types';
import { User } from 'firebase/auth';

export function useData(user: User | null) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      setError(null);

      const timeout = setTimeout(() => {
        console.warn('Firestore took too long, loading with default data');
        setData(DEFAULT_DATA);
        setLoading(false);
      }, 10000);

      getData(user.uid)
        .then((d) => {
          clearTimeout(timeout);
          setData(d);
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('Failed to fetch user data:', err);
          setError(err.message || 'Failed to load data');
          setData(DEFAULT_DATA);
          setLoading(false);
        });

      return () => clearTimeout(timeout);
    } else {
      setData(null);
      setLoading(false);
    }
  }, [user]);

  const updateData = useCallback(async (partial: Partial<AppData>): Promise<AppData> => {
    if (!user) return DEFAULT_DATA;
    await saveData(user.uid, partial);
    const fresh = await getData(user.uid);
    setData(fresh);
    return fresh;
  }, [user]);

  const refresh = useCallback(async (): Promise<AppData> => {
    if (!user) return DEFAULT_DATA;
    const fresh = await getData(user.uid);
    setData(fresh);
    return fresh;
  }, [user]);

  return { data, loading, updateData, refresh, error };
}
