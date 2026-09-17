import { useState } from 'react';
import { useDayTheme } from '../theme/DayThemeProvider';
import type { TransitionMode, FluidIntensity } from '../types';

/**
 * Backwards-compatible bridge hook for transition & fluid settings.
 * All theme and color states are now controlled exclusively by DayThemeProvider & useDayPhase.
 */
export function useTheme() {
  const { phase, isDark } = useDayTheme();
  const [transitionMode, setTransitionModeState] = useState<TransitionMode>(
    () => (typeof localStorage !== 'undefined' ? (localStorage.getItem('transitionMode') as TransitionMode) : 'efficient') || 'efficient'
  );
  const [fluidIntensity, setFluidIntensityState] = useState<FluidIntensity>(
    () => (typeof localStorage !== 'undefined' ? (localStorage.getItem('fluidIntensity') as FluidIntensity) : 'balanced') || 'balanced'
  );

  const setTransitionMode = (m: TransitionMode) => {
    setTransitionModeState(m);
    localStorage.setItem('transitionMode', m);
    if (typeof window !== 'undefined') {
      window.document.documentElement.dataset.transitionMode = m;
    }
  };

  const setFluidIntensity = (i: FluidIntensity) => {
    setFluidIntensityState(i);
    localStorage.setItem('fluidIntensity', i);
    if (typeof window !== 'undefined') {
      window.document.documentElement.dataset.fluidIntensity = i;
    }
  };

  return {
    theme: isDark ? 'dark' : 'light',
    phase,
    isDark,
    transitionMode,
    setTransitionMode,
    fluidIntensity,
    setFluidIntensity,
    mounted: true,
  };
}
