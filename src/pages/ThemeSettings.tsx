import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { PALETTES, PaletteDefinition, DEFAULT_PALETTE_ID, DEFAULT_THEME_MODE } from '../theme/palettes';
import { getSchemeForPalette, schemeToCssVariables, M3ColorScheme } from '../theme/colorEngine';
import { useM3Theme } from '../theme/ThemeContext';
import { ThemeMode, isDarkModeActive } from '../theme/themeStore';
import { triggerHaptic } from '../utils/haptics';

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { theme, applyTheme, resetToDefault } = useM3Theme();

  // Local staging/pending state before pressing "Apply"
  const [pendingPaletteId, setPendingPaletteId] = useState<string>(theme.paletteId);
  const [pendingMode, setPendingMode] = useState<ThemeMode>(theme.mode);
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const pendingIsDark = useMemo(() => isDarkModeActive(pendingMode), [pendingMode]);
  const previewScheme: M3ColorScheme = useMemo(
    () => getSchemeForPalette(pendingPaletteId, pendingIsDark),
    [pendingPaletteId, pendingIsDark]
  );

  const previewCssVars = useMemo(() => schemeToCssVariables(previewScheme), [previewScheme]);

  const handleSelectPalette = (id: string) => {
    triggerHaptic('selection');
    setPendingPaletteId(id);
  };

  const handleSelectMode = (mode: ThemeMode) => {
    triggerHaptic('light');
    setPendingMode(mode);
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
    <div className="min-h-full p-4 sm:p-6 space-y-6 max-w-2xl mx-auto pb-28">
      {/* ── Header Row ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95"
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-heading font-bold text-gradient-dark">Appearance & Theme</h1>
          <p className="text-xs text-on-surface-variant">Material 3 Expressive System Palettes</p>
        </div>
        <div className="w-10" />
      </div>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {showAppliedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-2xl bg-success-container text-on-success-container text-xs font-semibold flex items-center justify-between shadow-m3-elevation-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Theme applied across all interfaces!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Color Scheme Mode (Light / Dark / System) ── */}
      <div className="p-5 rounded-[28px] bg-surface-container-low border border-outline-variant/40 space-y-3">
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
          Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface-container-high border border-outline-variant/30">
          {(
            [
              { mode: 'light', label: 'Light', icon: Sun },
              { mode: 'dark', label: 'Dark', icon: Moon },
              { mode: 'system', label: 'System', icon: Monitor },
            ] as const
          ).map(({ mode, label, icon: Icon }) => {
            const isSelected = pendingMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Palette Swatches Grid (10 Curated Options) ── */}
      <div className="p-5 rounded-[28px] bg-surface-container-low border border-outline-variant/40 space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Curated Palettes (10 Presets)
          </label>
          <span className="text-[11px] font-mono text-on-surface-variant">
            {PALETTES.find((p) => p.id === pendingPaletteId)?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PALETTES.map((palette) => {
            const isSelected = pendingPaletteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => handleSelectPalette(palette.id)}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all text-left ${
                  isSelected
                    ? 'bg-surface-container-high border-primary ring-2 ring-primary/30'
                    : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center shrink-0 border border-white/20"
                    style={{ backgroundColor: palette.seed }}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow-sm" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface block leading-tight truncate">
                        {palette.name}
                      </span>
                      {palette.isDefault && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant line-clamp-1">
                      {palette.description}
                    </span>
                  </div>
                </div>


                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Live Preview Card (Scoped to pending preview variables) ── */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
          Live Palette Preview
        </label>
        <div
          style={previewCssVars as any}
          className="p-5 rounded-[28px] bg-surface-container border border-outline-variant/50 space-y-4 shadow-sm transition-all duration-300"
        >
          {/* Mock Hero Card */}
          <div className="p-4 rounded-2xl bg-primary-container text-on-primary-container space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Home Hero Greeting</span>
              <Sparkles size={14} />
            </div>
            <p className="text-sm font-semibold leading-snug">
              "Good day, explorer! 4 tasks pending & gym streak active."
            </p>
          </div>

          {/* Mock Interactive Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-on-primary shadow-xs"
            >
              Primary Button
            </button>
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container">
              Tonal Chip
            </div>
            <div className="w-24 h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div className="w-2/3 h-full bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Apply & Reset Action Buttons ── */}
      <div className="pt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-3.5 px-5 rounded-2xl text-xs font-bold bg-primary text-on-primary shadow-m3-elevation-1 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Check size={16} />
          <span>Apply Theme</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="py-3.5 px-4 rounded-2xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
