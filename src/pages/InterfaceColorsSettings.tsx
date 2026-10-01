import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { PRESET_ACCENTS, getActiveAccent, setActiveAccent, ThemeAccent } from '../theme/themeColorManager';
import { triggerHaptic } from '../utils/haptics';
import GlassSurface from '../components/glass/GlassSurface';
import GlassPill from '../components/glass/GlassPill';

interface InterfaceColorsSettingsProps {
  data?: any;
  updateData?: any;
}

export default function InterfaceColorsSettings(_props?: InterfaceColorsSettingsProps) {
  const navigate = useNavigate();
  const [currentAccent, setCurrentAccent] = useState<ThemeAccent>(getActiveAccent);

  const handleSelectAccent = (acc: ThemeAccent) => {
    triggerHaptic('medium');
    setCurrentAccent(acc);
    setActiveAccent(acc);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            triggerHaptic('light');
            navigate(-1);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--glass-2)] border border-[var(--rim)] text-primary hover:bg-[var(--glass-3)] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-xl font-bold text-primary font-heading">
            App Color Theme
          </h1>
          <p className="text-xs text-secondary font-medium">
            Android 17 Gemini Intelligence Unified Accent
          </p>
        </div>
      </div>

      {/* Hero Accent Preview */}
      <GlassSurface level={2} tinted grain className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-text)] font-tag">
          <Sparkles size={14} />
          <span>Active Accent Palette</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              {currentAccent.name}
            </h2>
            <p className="text-xs text-secondary mt-1">
              Recolors all cards, navigation, pills, charts, and glows dynamically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentAccent.primary }}
            />
            <div
              className="w-8 h-8 rounded-full shadow-lg border-2 border-white/20"
              style={{ backgroundColor: currentAccent.secondary }}
            />
          </div>
        </div>
      </GlassSurface>

      {/* Preset Color Choices Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary font-tag px-1">
          Preset Palettes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_ACCENTS.map((acc) => {
            const isSelected = currentAccent.id === acc.id || currentAccent.primary === acc.primary;

            return (
              <GlassSurface
                key={acc.id}
                level={isSelected ? 3 : 1}
                interactive
                onClick={() => handleSelectAccent(acc)}
                className={`p-4 flex items-center justify-between transition-all ${
                  isSelected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full shadow-md border border-white/20 shrink-0 flex items-center justify-center text-white"
                    style={{ backgroundColor: acc.primary }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">
                      {acc.name}
                    </div>
                    <div className="text-[11px] font-mono text-secondary">
                      {acc.primary} · {acc.secondary}
                    </div>
                  </div>
                </div>

                <GlassPill active={isSelected} className="text-xs">
                  {isSelected ? 'Active' : 'Apply'}
                </GlassPill>
              </GlassSurface>
            );
          })}
        </div>
      </div>
    </div>
  );
}
