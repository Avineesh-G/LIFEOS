import { useState, useEffect, useCallback } from 'react';

export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening' | 'night';

export interface DayPhaseState {
  phase: DayPhase;
  nextPhase: DayPhase;
  progress: number; // 0 to 1 through current phase
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
 * Updates on a 30-second interval and immediately on document visibility resume.
 * Contains no pixel/canvas concerns.
 */
export function useDayPhase(): DayPhaseState {
  const [timeState, setTimeState] = useState<DayPhaseState>(() => calculatePhaseAndProgress());

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

  return timeState;
}
