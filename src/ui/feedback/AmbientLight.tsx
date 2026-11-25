import React from 'react';
import { useLocation } from 'react-router-dom';

export type AmbientSetting = 'off' | 'low' | 'medium';

export interface AmbientLightProps {
  setting?: AmbientSetting;
}

/**
 * Ambient Light Layer — Whisper-light single-hue M3 glow behind top viewport
 */
export function AmbientLight({ setting }: AmbientLightProps) {
  useLocation();
  const [ambientSetting, setAmbientSetting] = React.useState<AmbientSetting>(() => {
    if (setting) return setting;
    try {
      const saved = localStorage.getItem('lifeos_ambient_light') as AmbientSetting;
      if (saved === 'off' || saved === 'low' || saved === 'medium') return saved;
    } catch {}
    return 'medium';
  });

  React.useEffect(() => {
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
      className="fixed top-0 inset-x-0 h-[44vh] pointer-events-none -z-10 overflow-hidden transition-opacity duration-300 ease-out"
      style={{
        background: `
          radial-gradient(ellipse 75% 60% at 22% -4%, var(--ambient, rgba(10, 132, 255, 0.08)) 0%, transparent 100%),
          radial-gradient(ellipse 65% 50% at 82% 10%, var(--ambient-secondary, rgba(90, 200, 250, 0.055)) 0%, transparent 100%)
        `,
      }}
      aria-hidden="true"
    />
  );
}

export default AmbientLight;
