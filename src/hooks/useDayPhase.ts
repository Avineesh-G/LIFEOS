import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';

export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening' | 'night';

export type ThemeMode = 'dynamic' | 'night';

export interface DayPhaseState {
  phase: DayPhase;
  nextPhase: DayPhase;
  progress: number; // 0 to 1 through current phase
}

export const THEME_MODE_PREF_KEY = 'lifeos_theme_mode';

/**
 * Chosen constant progress for Full Night mode: 0.5.
 * Night spans 7 hours from 22:00 to 05:00.
 * A progress of 0.5 corresponds to 01:30 AM (deepest midnight),
 * well past dusk's warm embers and well before dawn's horizon glow,
 * providing the purest deep celestial sky and optimal calm contrast.
 */
export const FIXED_NIGHT_PROGRESS = 0.5;

export const FIXED_NIGHT_STATE: DayPhaseState = {
  phase: 'night',
  nextPhase: 'dawn',
  progress: FIXED_NIGHT_PROGRESS,
};

// ── In-Memory Reactive Store with Preferences Persistence ──
let currentThemeMode: ThemeMode = 'dynamic';
const themeModeListeners = new Set<(mode: ThemeMode) => void>();

// Synchronous hydration from localStorage to prevent flash of content on web/hybrid
if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem(THEME_MODE_PREF_KEY);
    if (cached === 'night' || cached === 'dynamic') {
      currentThemeMode = cached;
    }
  } catch {}
}

// Asynchronous hydration from Capacitor Preferences (native Android / persistent storage)
Preferences.get({ key: THEME_MODE_PREF_KEY })
  .then(({ value }) => {
    if (value === 'night' || value === 'dynamic') {
      if (currentThemeMode !== value) {
        currentThemeMode = value as ThemeMode;
        themeModeListeners.forEach(fn => fn(currentThemeMode));
      }
    }
  })
  .catch(() => {});

export function getThemeMode(): ThemeMode {
  return currentThemeMode;
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  if (currentThemeMode === mode) return;
  currentThemeMode = mode;

  try {
    localStorage.setItem(THEME_MODE_PREF_KEY, mode);
  } catch {}

  // Reactively notify all active subscribers instantly (0ms latency, no remount required)
  themeModeListeners.forEach(fn => fn(currentThemeMode));

  // Persist to Capacitor Preferences asynchronously
  Preferences.set({ key: THEME_MODE_PREF_KEY, value: mode }).catch(err => {
    console.warn('[useDayPhase] Failed to save themeMode to Preferences:', err);
  });
}

export function subscribeThemeMode(fn: (mode: ThemeMode) => void): () => void {
  themeModeListeners.add(fn);
  return () => {
    themeModeListeners.delete(fn);
  };
}

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);

  useEffect(() => {
    return subscribeThemeMode(setMode);
  }, []);

  return [mode, setThemeMode];
}

/**
 * Computes current day phase, next phase, and fractional progress (0-1)
 * based on the real device clock.
 * Single source of truth for both ambient canvas backgrounds and UI themes.
 */
export function calculatePhaseAndProgress(now: Date = new Date()): DayPhaseState {
  // Query parameter debug override for development & QA (e.g. ?phase=night)
  if (typeof window !== 'undefined') {
    const override = new URLSearchParams(window.location.search).get('phase')?.toLowerCase() as DayPhase | null;
    const validPhases: DayPhase[] = ['dawn', 'morning', 'afternoon', 'dusk', 'evening', 'night'];
    if (override && validPhases.includes(override)) {
      const nextPhaseMap: Record<DayPhase, DayPhase> = {
        dawn: 'morning',
        morning: 'afternoon',
        afternoon: 'dusk',
        dusk: 'evening',
        evening: 'night',
        night: 'dawn',
      };
      return {
        phase: override,
        nextPhase: nextPhaseMap[override],
        progress: 0.5,
      };
    }
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const decimalHour = hours + minutes / 60 + seconds / 3600;

  let phase: DayPhase;
  let nextPhase: DayPhase;
  let progress = 0;

  if (decimalHour >= 5 && decimalHour < 8) {
    phase = 'dawn';
    nextPhase = 'morning';
    progress = (decimalHour - 5) / 3;
  } else if (decimalHour >= 8 && decimalHour < 12) {
    phase = 'morning';
    nextPhase = 'afternoon';
    progress = (decimalHour - 8) / 4;
  } else if (decimalHour >= 12 && decimalHour < 17) {
    phase = 'afternoon';
    nextPhase = 'dusk';
    progress = (decimalHour - 12) / 5;
  } else if (decimalHour >= 17 && decimalHour < 19) {
    phase = 'dusk';
    nextPhase = 'evening';
    progress = (decimalHour - 17) / 2;
  } else if (decimalHour >= 19 && decimalHour < 22) {
    phase = 'evening';
    nextPhase = 'night';
    progress = (decimalHour - 19) / 3;
  } else {
    // Night: 22:00 to 05:00 (7 hours span across midnight)
    phase = 'night';
    nextPhase = 'dawn';
    if (decimalHour >= 22) {
      progress = (decimalHour - 22) / 7;
    } else {
      progress = (2 + decimalHour) / 7;
    }
  }

  return {
    phase,
    nextPhase,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

/**
 * Shared hook returning the active DayPhase and normalized progress.
 * Central single source of truth:
 * - If themeMode === 'night': returns fixed deep-night state { phase: 'night', nextPhase: 'dawn', progress: 0.5 }
 * - If themeMode === 'dynamic': returns real live device time state
 * Downstream consumers (DayThemeProvider, useMaterialTheme, typography weights) automatically stay in sync.
 */
export function useDayPhase(): DayPhaseState {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode);
  const [timeState, setTimeState] = useState<DayPhaseState>(() => calculatePhaseAndProgress());

  useEffect(() => {
    return subscribeThemeMode(setThemeModeState);
  }, []);

  const refreshTime = useCallback(() => {
    setTimeState(calculatePhaseAndProgress());
  }, []);

  useEffect(() => {
    const timer = setInterval(refreshTime, 30000);

    const handleVisibility = () => {
      if (!document.hidden) {
        refreshTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('popstate', refreshTime);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('popstate', refreshTime);
    };
  }, [refreshTime]);

  if (themeMode === 'night') {
    return FIXED_NIGHT_STATE;
  }

  return timeState;
}
