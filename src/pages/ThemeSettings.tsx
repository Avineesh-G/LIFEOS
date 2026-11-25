/**
 * LifeOS — Appearance & M3 Color Studio (Pure iOS Liquid Glass + Light Single-Hue Gradient)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ArrowCounterClockwise,
  Sparkle,
  Palette,
  SunHorizon,
} from '@phosphor-icons/react';
import { PALETTES, DEFAULT_PALETTE_ID, DEFAULT_THEME_MODE } from '../theme/palettes';
import { useM3Theme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/themeStore';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { LargeTitleHeader } from '../ui/navigation/LargeTitleHeader';
import { Button } from '../ui/controls/Button';

type AmbientSetting = 'off' | 'low' | 'medium';

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { theme, activePalette, applyTheme, resetToDefault } = useM3Theme();

  const [pendingPaletteId, setPendingPaletteId] = useState<string>(theme.paletteId);
  const [pendingMode, setPendingMode] = useState<ThemeMode>(theme.mode);
  const [ambient, setAmbient] = useState<AmbientSetting>(() => {
    try {
      const saved = localStorage.getItem('lifeos_ambient_light') as AmbientSetting;
      if (saved === 'off' || saved === 'low' || saved === 'medium') return saved;
    } catch {}
    return 'medium';
  });
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const selectedPalette = PALETTES.find((p) => p.id === pendingPaletteId) || activePalette;

  const handleSelectPalette = (id: string) => {
    triggerHaptic('selection');
    setPendingPaletteId(id);
    applyTheme({
      paletteId: id,
      mode: pendingMode,
    });
  };

  const handleAmbientChange = (val: AmbientSetting) => {
    triggerHaptic('selection');
    setAmbient(val);
    try {
      localStorage.setItem('lifeos_ambient_light', val);
      window.dispatchEvent(new Event('lifeos:ambient-light-changed'));
    } catch {}
  };

  const handleApply = () => {
    triggerHaptic('save');
    applyTheme({
      paletteId: pendingPaletteId,
      mode: pendingMode,
    });
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 2500);
  };

  const handleReset = () => {
    triggerHaptic('heavy');
    setPendingPaletteId(DEFAULT_PALETTE_ID);
    setPendingMode(DEFAULT_THEME_MODE);
    resetToDefault();
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 2500);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-6">
      <LargeTitleHeader
        title="Appearance"
        subtitle={`Active Preset · ${selectedPalette.name}`}
        onBack={() => handleAppBack(navigate)}
        actions={
          <button
            type="button"
            onClick={handleReset}
            className="w-9 h-9 rounded-full glass-grouped-toolbar flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            style={{ color: 'var(--app-accent-text, #DE4B64)' }}
            title="Reset to Burgundy Default"
            aria-label="Reset to Burgundy Default"
          >
            <ArrowCounterClockwise size={17} weight="bold" />
          </button>
        }
      />

      <div className="max-w-xl mx-auto px-1 pt-1 space-y-5">
        {showAppliedToast && (
          <div
            className="p-3.5 rounded-2xl glass-tile text-xs font-semibold flex items-center gap-2"
            style={{ color: 'var(--app-accent-text, #DE4B64)' }}
          >
            <Sparkle size={16} weight="fill" />
            <span>Single-hue M3 theme applied across all interfaces & pop-ups</span>
          </div>
        )}

        {/* Active Preset Preview Card */}
        <div className="glass-hero p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${selectedPalette.seed} 0%, ${selectedPalette.secondarySeed} 100%)`,
                }}
              >
                <Palette size={19} weight="fill" className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{selectedPalette.name}</div>
                <div className="text-[11.5px] text-white/65 truncate">{selectedPalette.description}</div>
              </div>
            </div>
            <span
              className="text-[10.5px] font-bold px-2.5 py-1 rounded-full shrink-0"
              style={{
                backgroundColor: 'var(--app-accent-soft, rgba(10, 132, 255, 0.14))',
                color: 'var(--app-accent-text, #DE4B64)',
              }}
            >
              Active
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full w-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--app-accent, #8B1E3F) 0%, var(--app-accent-end, #B52B4D) 100%)',
              }}
            />
          </div>
        </div>

        {/* Light Ambient Intensity */}
        <div className="glass-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunHorizon size={16} weight="duotone" style={{ color: 'var(--app-accent-text, #DE4B64)' }} />
              <span className="text-xs font-bold uppercase tracking-wider text-white/75">
                Ambient Glow Intensity
              </span>
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--app-accent-text, #DE4B64)' }}>
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
                  style={active ? { color: 'var(--app-accent-text, #DE4B64)' } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* M3 + iOS Unified Presets */}
        <div className="space-y-2.5">
          <div className="text-xs uppercase tracking-wider font-semibold px-1 text-white/70">
            Theme Color Presets
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PALETTES.map((pal) => {
              const isSelected = pendingPaletteId === pal.id;
              return (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => handleSelectPalette(pal.id)}
                  className={`p-3.5 rounded-2xl text-left transition-transform active:scale-[0.98] relative select-none cursor-pointer ${
                    isSelected ? 'droplet-active' : 'glass-tile'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className="w-7 h-7 rounded-full shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${pal.seed} 0%, ${pal.secondarySeed} 100%)`,
                      }}
                    />
                    {isSelected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{
                          background: `linear-gradient(135deg, ${pal.seed} 0%, ${pal.secondarySeed} 100%)`,
                        }}
                      >
                        <Check size={13} weight="bold" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white block leading-tight">
                    {pal.name}
                  </span>
                  <span className="text-[11px] text-white/60 line-clamp-1 mt-0.5 block">
                    {pal.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="prominent"
            className="w-full"
            onClick={handleApply}
          >
            Save & Apply Theme
          </Button>
        </div>
      </div>
    </div>
  );
}
