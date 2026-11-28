import { useState, useEffect } from 'react';
import {
  detectDeviceTier,
  subscribeToPerformanceMetrics,
  PerformanceMetrics,
} from '../utils/performanceEngine';

export function useDeviceTier(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => detectDeviceTier());

  useEffect(() => {
    return subscribeToPerformanceMetrics((updated) => {
      setMetrics({ ...updated });
    });
  }, []);

  return metrics;
}

export default useDeviceTier;
