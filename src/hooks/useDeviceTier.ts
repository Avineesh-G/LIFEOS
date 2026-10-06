import { useState, useEffect } from 'react';
import {
  detectDeviceTier,
  subscribeToPerformanceMetrics,
  PerformanceMetrics,
  setDeviceTierOverride,
  DeviceTier,
} from '../utils/performanceEngine';

export function useDeviceTier(): PerformanceMetrics & {
  setTier: (tier: DeviceTier | 'auto') => void;
} {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => detectDeviceTier());

  useEffect(() => {
    return subscribeToPerformanceMetrics((updated) => {
      setMetrics({ ...updated });
    });
  }, []);

  return {
    ...metrics,
    setTier: setDeviceTierOverride,
  };
}

export default useDeviceTier;
