import { useEffect, useState, useCallback } from 'react';
import { getData, saveData } from '../db';
import type { AppData } from '../types';

import { User } from 'firebase/auth';

export function useData(user: User | null) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getData().then((d) => {
        setData(d);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch user data:", err);
        setLoading(false);
      });
    } else {
      setData(null);
      setLoading(false);
    }
  }, [user]);

  const updateData = useCallback(async (partial: Partial<AppData>) => {
    await saveData(partial);
    const fresh = await getData();
    setData(fresh);
    return fresh;
  }, []);

  const refresh = useCallback(async () => {
    const fresh = await getData();
    setData(fresh);
    return fresh;
  }, []);

  return { data, loading, updateData, refresh };
}
