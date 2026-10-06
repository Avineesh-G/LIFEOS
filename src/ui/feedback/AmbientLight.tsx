import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSectionFromPathname } from '../../theme/sectionSeedColors';

export type AmbientSetting = 'off' | 'low' | 'medium';

export interface AmbientLightProps {
  setting?: AmbientSetting;
}

/**
 * Ambient Light Layer (Section 3.6):
 * One fixed layer behind the content, pointer-events: none, height 45vh.
 * Two radial gradients using --ambient fading to transparent at 100%.
 * Sits under the scroll edge gradient and under toolbar glass.
 * Fades smoothly on navigation without animation cost.
 */
export function AmbientLight({ setting }: AmbientLightProps) {
  const location = useLocation();
  const [ambientSetting, setAmbientSetting] = useState<AmbientSetting>(() => {
    if (setting) return setting;
    try {
      const saved = localStorage.getItem('lifeos_ambient_light') as AmbientSetting;
      if (saved === 'off' || saved === 'low' || saved === 'medium') return saved;
    } catch {}
    return 'medium'; // Default Medium
  });

  useEffect(() => {
    if (setting) {
      setAmbientSetting(setting);
      return;
    }
    const handler = () => {
      try {
        const saved = localStorage.getItem('lifeos_ambient_light') as AmbientSetting;
        if (saved === 'off' || saved === 'low' || saved === 'medium') {
          setAmbientSetting(saved);
        }
      } catch {}
    };
    window.addEventListener('lifeos:ambient-light-changed', handler);
    return () => window.removeEventListener('lifeos:ambient-light-changed', handler);
  }, [setting]);

  if (ambientSetting === 'off') return null;

  return (
    <div
      className="fixed top-0 inset-x-0 h-[45vh] pointer-events-none -z-10 overflow-hidden transition-opacity duration-400 ease-out"
      style={{
        background: `
          radial-gradient(ellipse 70% 60% at 20% 0%, var(--ambient, rgba(94, 92, 230, 0.14)) 0%, transparent 100%),
          radial-gradient(ellipse 60% 50% at 80% 10%, var(--ambient, rgba(94, 92, 230, 0.14)) 0%, transparent 100%)
        `,
      }}
      aria-hidden="true"
    />
  );
}

export default AmbientLight;
