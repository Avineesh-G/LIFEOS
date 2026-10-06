/**
 * LifeOS — ThemeSettings Component (iOS 26 Liquid Glass)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CaretLeft,
  Check,
  ArrowCounterClockwise,
  Sparkle,
  Moon,
} from '@phosphor-icons/react';
import { PALETTES, DEFAULT_PALETTE_ID, DEFAULT_THEME_MODE } from '../theme/palettes';
import { useM3Theme } from '../theme/ThemeContext';
import { ThemeMode } from '../theme/themeStore';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { Toolbar } from '../ui/navigation/Toolbar';
import { Button } from '../ui/controls/Button';

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { theme, applyTheme, resetToDefault } = useM3Theme();

  const [pendingPaletteId, setPendingPaletteId] = useState<string>(theme.paletteId);
  const [pendingMode, setPendingMode] = useState<ThemeMode>(theme.mode);
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const handleSelectPalette = (id: string) => {
    triggerHaptic('selection');
    setPendingPaletteId(id);
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
    <div className="min-h-screen bg-black text-white pb-4 selection:bg-[#0A84FF]/30">
      {/* ── Toolbar ── */}
      <Toolbar
        leading={
          <button
            onClick={() => handleAppBack(navigate)}
            className="p-2 rounded-full text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
        }
        center={
          <span className="text-sm font-semibold text-white">
            Appearance & Theme
          </span>
        }
        trailing={
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-[#8E8E93] hover:text-white transition-colors"
            title="Reset to default"
          >
            <ArrowCounterClockwise size={18} />
          </button>
        }
      />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-6">
        {/* Toast */}
        {showAppliedToast && (
          <div className="p-3.5 rounded-2xl glass-card text-[#30D158] text-xs font-semibold flex items-center gap-2">
            <Sparkle size={16} weight="fill" />
            <span>Theme updated across all interfaces</span>
          </div>
        )}

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-[#8E8E93] font-semibold px-1">
            Display Mode
          </label>
          <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Moon size={18} weight="fill" className="text-[#0A84FF]" />
              <span className="text-sm font-semibold text-white">Liquid Glass Pure Black Canvas</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full glass-flat text-[#0A84FF]">
              Active
            </span>
          </div>
        </div>

        {/* Accent Palettes */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider text-[#8E8E93] font-semibold px-1">
            System Accent Tints
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PALETTES.map((pal) => {
              const isSelected = pendingPaletteId === pal.id;
              return (
                <button
                  key={pal.id}
                  onClick={() => handleSelectPalette(pal.id)}
                  className={`p-4 rounded-2xl text-left transition-all relative select-none ${
                    isSelected
                      ? 'glass-card bg-white/[0.12] ring-1 ring-white/20'
                      : 'glass-card hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: pal.seed }}
                    />
                    {isSelected && (
                      <Check size={16} weight="bold" className="text-white" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white block">
                    {pal.name}
                  </span>
                  <span className="text-[11px] text-[#8E8E93]">
                    {pal.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Apply Action */}
        <div className="pt-4">
          <Button
            variant="prominent"
            className="w-full"
            onClick={handleApply}
          >
            Apply Theme
          </Button>
        </div>
      </div>
    </div>
  );
}
