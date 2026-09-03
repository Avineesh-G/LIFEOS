import { useEffect, useState, useCallback } from 'react';
import { getData, saveData } from '../db';
import type { AppData } from '../types';

export function useData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

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
