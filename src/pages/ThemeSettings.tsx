/**
 * LifeOS — Fixed Warm Brown Theme Status
 * Color adaptation and custom color presets are disabled; Warm Brown is applied uniformly across all interfaces.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, SunHorizon } from '@phosphor-icons/react';
import { WARM_BROWN_PALETTE } from '../theme/palettes';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { LargeTitleHeader } from '../ui/navigation/LargeTitleHeader';

type AmbientSetting = 'off' | 'low' | 'medium';

export default function ThemeSettings() {
  const navigate = useNavigate();
  const [ambient, setAmbient] = useState<AmbientSetting>(() => {
    try {
      const saved = localStorage.getItem('lifeos_ambient_light') as AmbientSetting;
      if (saved === 'off' || saved === 'low' || saved === 'medium') return saved;
    } catch {}
    return 'medium';
  });

  const handleAmbientChange = (val: AmbientSetting) => {
    triggerHaptic('selection');
    setAmbient(val);
    try {
      localStorage.setItem('lifeos_ambient_light', val);
      window.dispatchEvent(new Event('lifeos:ambient-light-changed'));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-black text-white pb-6">
      <LargeTitleHeader
        title="Appearance"
        subtitle={`Fixed Theme · ${WARM_BROWN_PALETTE.name}`}
        onBack={() => handleAppBack(navigate)}
      />

      <div className="max-w-xl mx-auto px-1 pt-1 space-y-5">
        <div className="glass-hero p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${WARM_BROWN_PALETTE.seed} 0%, ${WARM_BROWN_PALETTE.secondarySeed} 100%)`,
                }}
              >
                <Palette size={19} weight="fill" className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{WARM_BROWN_PALETTE.name}</div>
                <div className="text-[11.5px] text-white/65 truncate">{WARM_BROWN_PALETTE.description}</div>
              </div>
            </div>
            <span
              className="text-[10.5px] font-bold px-2.5 py-1 rounded-full shrink-0"
              style={{
                backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                color: 'var(--app-accent-text, #D29B7E)',
              }}
            >
              Fixed
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full w-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--app-accent, #7B4B36) 0%, var(--app-accent-end, #A46D52) 100%)',
              }}
            />
          </div>
        </div>

        <div className="glass-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunHorizon size={16} weight="duotone" style={{ color: 'var(--app-accent-text, #D29B7E)' }} />
              <span className="text-xs font-bold uppercase tracking-wider text-white/75">
                Ambient Glow Intensity
              </span>
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
              {ambient === 'medium' ? 'Light Ambient' : ambient === 'low' ? 'Ultra Subtle' : 'Off'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'off' as const, label: 'Off' },
              { id: 'low' as const, label: 'Subtle' },
              { id: 'medium' as const, label: 'Ambient' },
            ]).map((opt) => {
              const active = ambient === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAmbientChange(opt.id)}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    active ? 'droplet-active' : 'glass-flat text-white/60 hover:text-white'
                  }`}
                  style={active ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
