import { useState, useEffect } from 'react';
import {
  detectDeviceTier,
  subscribeToPerformanceMetrics,
  type PerformanceMetrics,
} from '../../utils/performanceEngine';

export type GlassTier = 'tier-1' | 'tier-2' | 'tier-3';
export type GlassSetting = 'auto' | 'lite' | 'off';

function mapMetricsToGlassTier(metrics: PerformanceMetrics): GlassTier {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('lifeos_glass_setting') as GlassSetting | null;
      if (saved === 'off') return 'tier-3';
      if (saved === 'lite') return 'tier-2';
      if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
        return 'tier-3';
      }
    } catch {}
  }
  return `tier-${metrics.tier}` as GlassTier;
}

/**
 * Unified Glass Tier hook backed by the RAM / Cores / GPU / Storage Performance Engine.
 * Eliminates continuous background rAF polling for zero idle CPU/battery overhead.
 */
export function useGlassTier(): GlassTier {
  const [tier, setTier] = useState<GlassTier>(() => mapMetricsToGlassTier(detectDeviceTier()));

  useEffect(() => {
    return subscribeToPerformanceMetrics((metrics) => {
      setTier(mapMetricsToGlassTier(metrics));
    });
  }, []);

  return tier;
}
