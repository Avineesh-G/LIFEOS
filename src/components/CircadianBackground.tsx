import React, { useMemo } from 'react';

export type CircadianPhase = 'dawn' | 'day' | 'dusk' | 'night';

interface CircadianConfig {
  phase: CircadianPhase;
  label: string;
  orb1Class: string;
  orb2Class: string;
  orb3Class: string;
}

/**
 * Circadian Ambient Mesh & Frosted Glass Caustics.
 * Blends time-of-day adaptive celestial hues with liquid frosted glass depth.
 * 100% GPU-composited with zero CPU loop overhead.
 */
export default function CircadianBackground() {
  const circadian = useMemo<CircadianConfig>(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      // Dawn: Golden sunrise champagne & dewy indigo
      return {
        phase: 'dawn',
        label: 'Sunrise Dawn',
        orb1Class: 'bg-amber-400/20 dark:bg-amber-600/15',
        orb2Class: 'bg-indigo-400/20 dark:bg-indigo-600/18',
        orb3Class: 'bg-rose-400/15 dark:bg-rose-700/12',
      };
    } else if (hour >= 11 && hour < 17) {
      // Afternoon: High-performance crystalline electric sapphire & lavender
      return {
        phase: 'day',
        label: 'Peak Focus',
        orb1Class: 'bg-indigo-500/20 dark:bg-indigo-600/22',
        orb2Class: 'bg-cyan-400/18 dark:bg-cyan-600/15',
        orb3Class: 'bg-purple-500/15 dark:bg-purple-700/15',
      };
    } else if (hour >= 17 && hour < 21) {
      // Dusk: Stoic amber-plum twilight & warm dusk
      return {
        phase: 'dusk',
        label: 'Stoic Twilight',
        orb1Class: 'bg-purple-600/22 dark:bg-purple-700/22',
        orb2Class: 'bg-amber-500/20 dark:bg-orange-600/16',
        orb3Class: 'bg-rose-500/15 dark:bg-rose-800/14',
      };
    } else {
      // Night: Pitch OLED deep space & starlight violet
      return {
        phase: 'night',
        label: 'Deep Regeneration',
        orb1Class: 'bg-indigo-900/25 dark:bg-indigo-950/40',
        orb2Class: 'bg-violet-900/20 dark:bg-purple-950/35',
        orb3Class: 'bg-emerald-950/15 dark:bg-emerald-950/25',
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* ── Pre-softened Radial Ambient Glows (Zero filter: blur GPU passes) ── */}
      <div
        className="absolute -top-32 -left-28 w-[460px] h-[460px] rounded-full opacity-25 animate-ambient-drift-1"
        style={{ background: 'radial-gradient(circle, var(--app-accent, #7B4B36) 0%, transparent 72%)' }}
      />

      <div
        className="absolute top-1/4 -right-32 w-[440px] h-[440px] rounded-full opacity-20 animate-ambient-drift-2"
        style={{ background: 'radial-gradient(circle, var(--app-accent-end, #A46D52) 0%, transparent 72%)' }}
      />

      <div
        className="absolute -bottom-36 left-1/4 w-[420px] h-[420px] rounded-full opacity-15 animate-ambient-drift-3"
        style={{ background: 'radial-gradient(circle, var(--app-accent, #7B4B36) 0%, transparent 72%)' }}
      />
    </div>
  );
}
