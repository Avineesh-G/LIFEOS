import { useState, useEffect } from 'react';

export type GlassTier = 'tier-1' | 'tier-2' | 'tier-3';
export type GlassSetting = 'auto' | 'lite' | 'off';

export function useGlassTier(): GlassTier {
  const [tier, setTier] = useState<GlassTier>(() => {
    try {
      const saved = localStorage.getItem('lifeos_glass_setting') as GlassSetting;
      if (saved === 'off') return 'tier-1';
      if (saved === 'lite') return 'tier-2';
      // Auto detection initial guess
      if (typeof navigator !== 'undefined' && (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
        return 'tier-2';
      }
      return 'tier-3';
    } catch {
      return 'tier-2';
    }
  });

  useEffect(() => {
    const handleGlassChange = () => {
      const saved = localStorage.getItem('lifeos_glass_setting') as GlassSetting;
      if (saved === 'off') setTier('tier-1');
      else if (saved === 'lite') setTier('tier-2');
      else setTier('tier-3');
    };

    window.addEventListener('lifeos-glass-tier-changed', handleGlassChange);
    return () => window.removeEventListener('lifeos-glass-tier-changed', handleGlassChange);
  }, []);

  return tier;
}
