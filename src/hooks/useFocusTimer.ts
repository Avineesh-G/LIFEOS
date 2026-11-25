import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import type { FocusMode } from '../types';

export type FocusPhase = 'focus' | 'break';
export type FocusStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface FocusPresetConfig {
  mode: Exclude<FocusMode, 'stopwatch'>;
  label: string;
  shortLabel: string;
  focusMinutes: number;
  breakMinutes: number;
}

export const FOCUS_PRESETS: FocusPresetConfig[] = [
  { mode: 'pomodoro', label: 'Classic 25/5', shortLabel: '25m', focusMinutes: 25, breakMinutes: 5 },
  { mode: 'deep', label: 'Deep 50/10', shortLabel: '50m', focusMinutes: 50, breakMinutes: 10 },
  { mode: 'sprint', label: 'Sprint 90/20', shortLabel: '90m', focusMinutes: 90, breakMinutes: 20 },
  { mode: 'custom', label: 'Custom', shortLabel: 'Custom', focusMinutes: 35, breakMinutes: 5 },
];

export interface PersistedFocusState {
  phase: FocusPhase;
  status: FocusStatus;
  mode: Exclude<FocusMode, 'stopwatch'>;
  customMinutes: number;
  totalMs: number;
  targetEndMs: number | null;
  pausedRemainingMs: number;
  startedAtIso: string | null;
  targetLabel: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  quickNotes: string[];
  distractionsLogged: number;
  cyclesCompleted: number;
  lastCompletedMinutes: number;
}

const STORAGE_KEY = 'lifeos_focus_timer_v1';

function createInitialState(): PersistedFocusState {
  const defaultTotal = 25 * 60 * 1000;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedFocusState>;
      if (parsed && typeof parsed === 'object') {
        const totalMs = typeof parsed.totalMs === 'number' && parsed.totalMs > 0 ? parsed.totalMs : defaultTotal;
        const mode =
          parsed.mode === 'deep' || parsed.mode === 'sprint' || parsed.mode === 'custom'
            ? parsed.mode
            : 'pomodoro';
        const customMinutes =
          typeof parsed.customMinutes === 'number' && parsed.customMinutes >= 5 && parsed.customMinutes <= 180
            ? parsed.customMinutes
            : 35;

        let status: FocusStatus =
          parsed.status === 'running' || parsed.status === 'paused' || parsed.status === 'completed'
            ? parsed.status
            : 'idle';
        let pausedRemainingMs =
          typeof parsed.pausedRemainingMs === 'number' && parsed.pausedRemainingMs >= 0
            ? parsed.pausedRemainingMs
            : totalMs;
        let lastCompletedMinutes =
          typeof parsed.lastCompletedMinutes === 'number' ? parsed.lastCompletedMinutes : 0;

        if (status === 'running' && typeof parsed.targetEndMs === 'number') {
          const left = parsed.targetEndMs - Date.now();
          if (left <= 0) {
            status = 'completed';
            pausedRemainingMs = 0;
            lastCompletedMinutes = Math.max(1, Math.round(totalMs / 60000));
          } else {
            pausedRemainingMs = left;
          }
        }

        return {
          phase: parsed.phase === 'break' ? 'break' : 'focus',
          status,
          mode,
          customMinutes,
          totalMs,
          targetEndMs: status === 'running' ? parsed.targetEndMs ?? null : null,
          pausedRemainingMs,
          startedAtIso: parsed.startedAtIso || null,
          targetLabel: parsed.targetLabel || 'Open Deep Work',
          linkedTaskId: parsed.linkedTaskId || undefined,
          linkedProjectId: parsed.linkedProjectId || undefined,
          quickNotes: Array.isArray(parsed.quickNotes) ? parsed.quickNotes : [],
          distractionsLogged: typeof parsed.distractionsLogged === 'number' ? parsed.distractionsLogged : 0,
          cyclesCompleted: typeof parsed.cyclesCompleted === 'number' ? parsed.cyclesCompleted : 0,
          lastCompletedMinutes,
        };
      }
    }
  } catch {
    // Ignore corrupt local state
  }

  return {
    phase: 'focus',
    status: 'idle',
    mode: 'pomodoro',
    customMinutes: 35,
    totalMs: defaultTotal,
    targetEndMs: null,
    pausedRemainingMs: defaultTotal,
    startedAtIso: null,
    targetLabel: 'Open Deep Work',
    linkedTaskId: undefined,
    linkedProjectId: undefined,
    quickNotes: [],
    distractionsLogged: 0,
    cyclesCompleted: 0,
    lastCompletedMinutes: 0,
  };
}

export interface UseFocusTimerOptions {
  onTimerReachedZero?: (phase: FocusPhase, targetLabel: string, minutes: number) => void;
}

export function useFocusTimer(options?: UseFocusTimerOptions) {
  const [state, setState] = useState<PersistedFocusState>(createInitialState);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const onZeroRef = useRef(options?.onTimerReachedZero);
  onZeroRef.current = options?.onTimerReachedZero;

  // Persist timer snapshot lightly on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota issues
    }
  }, [state]);

  // High-precision wall-clock ticker while running + visibility sync
  useEffect(() => {
    if (state.status !== 'running' || !state.targetEndMs) return;

    const tick = () => {
      const current = Date.now();
      setNowMs(current);
      if (state.targetEndMs && current >= state.targetEndMs) {
        const completedMins = Math.max(1, Math.round(state.totalMs / 60000));
        setState((prev) => {
          if (prev.status !== 'running') return prev;
          return {
            ...prev,
            status: 'completed',
            targetEndMs: null,
            pausedRemainingMs: 0,
            lastCompletedMinutes: completedMins,
          };
        });
        onZeroRef.current?.(state.phase, state.targetLabel, completedMins);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state.status, state.targetEndMs, state.totalMs, state.phase, state.targetLabel]);

  const remainingMs =
    state.status === 'running' && state.targetEndMs
      ? Math.max(0, state.targetEndMs - nowMs)
      : state.pausedRemainingMs;

  const progressRatio =
    state.totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / state.totalMs)) : 0;

  const selectMode = useCallback((mode: Exclude<FocusMode, 'stopwatch'>) => {
    setState((prev) => {
      if (prev.status === 'running' || prev.status === 'paused') return prev;
      const preset = FOCUS_PRESETS.find((p) => p.mode === mode) || FOCUS_PRESETS[0];
      const mins = mode === 'custom' ? prev.customMinutes : preset.focusMinutes;
      const totalMs = mins * 60 * 1000;
      return {
        ...prev,
        phase: 'focus',
        status: 'idle',
        mode,
        totalMs,
        pausedRemainingMs: totalMs,
        targetEndMs: null,
      };
    });
  }, []);

  const setCustomDuration = useCallback((mins: number) => {
    const clamped = Math.max(5, Math.min(180, Math.round(mins)));
    setState((prev) => {
      if (prev.status === 'running' || prev.status === 'paused') {
        return { ...prev, customMinutes: clamped };
      }
      const totalMs = clamped * 60 * 1000;
      return {
        ...prev,
        mode: 'custom',
        customMinutes: clamped,
        totalMs,
        pausedRemainingMs: totalMs,
      };
    });
  }, []);

  const setTarget = useCallback((label: string, linkedTaskId?: string, linkedProjectId?: string) => {
    setState((prev) => ({
      ...prev,
      targetLabel: label.trim() || 'Open Deep Work',
      linkedTaskId,
      linkedProjectId,
    }));
  }, []);

  const start = useCallback(() => {
    const now = Date.now();
    setNowMs(now);
    setState((prev) => {
      const durationMs =
        prev.status === 'paused' && prev.pausedRemainingMs > 0 ? prev.pausedRemainingMs : prev.totalMs;
      return {
        ...prev,
        status: 'running',
        targetEndMs: now + durationMs,
        pausedRemainingMs: durationMs,
        startedAtIso: prev.startedAtIso || format(new Date(now), 'HH:mm'),
      };
    });
  }, []);

  const pause = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      if (prev.status !== 'running' || !prev.targetEndMs) return prev;
      const left = Math.max(1000, prev.targetEndMs - now);
      return {
        ...prev,
        status: 'paused',
        targetEndMs: null,
        pausedRemainingMs: left,
      };
    });
  }, []);

  const extend = useCallback((minutes: number) => {
    const deltaMs = minutes * 60 * 1000;
    const now = Date.now();
    setNowMs(now);
    setState((prev) => {
      if (prev.status === 'running' && prev.targetEndMs) {
        return {
          ...prev,
          totalMs: prev.totalMs + deltaMs,
          targetEndMs: prev.targetEndMs + deltaMs,
        };
      }
      if (prev.status === 'paused' || prev.status === 'idle') {
        return {
          ...prev,
          totalMs: prev.totalMs + deltaMs,
          pausedRemainingMs: prev.pausedRemainingMs + deltaMs,
        };
      }
      return prev;
    });
  }, []);

  const addQuickNote = useCallback((note: string, countAsDistraction = false) => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      quickNotes: [...prev.quickNotes, trimmed],
      distractionsLogged: prev.distractionsLogged + (countAsDistraction ? 1 : 0),
    }));
  }, []);

  const finishEarly = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      const left =
        prev.status === 'running' && prev.targetEndMs
          ? Math.max(0, prev.targetEndMs - now)
          : prev.pausedRemainingMs;
      const elapsedMs = Math.max(0, prev.totalMs - left);
      const elapsedMins = Math.max(1, Math.round(elapsedMs / 60000));
      return {
        ...prev,
        status: 'completed',
        targetEndMs: null,
        pausedRemainingMs: 0,
        lastCompletedMinutes: elapsedMins,
      };
    });
  }, []);

  const resetToFocusIdle = useCallback((incrementCycle = false) => {
    setState((prev) => {
      const preset = FOCUS_PRESETS.find((p) => p.mode === prev.mode) || FOCUS_PRESETS[0];
      const mins = prev.mode === 'custom' ? prev.customMinutes : preset.focusMinutes;
      const totalMs = mins * 60 * 1000;
      return {
        ...prev,
        phase: 'focus',
        status: 'idle',
        totalMs,
        pausedRemainingMs: totalMs,
        targetEndMs: null,
        startedAtIso: null,
        quickNotes: [],
        distractionsLogged: 0,
        lastCompletedMinutes: 0,
        cyclesCompleted: prev.cyclesCompleted + (incrementCycle ? 1 : 0),
      };
    });
  }, []);

  const startBreak = useCallback((overrideMinutes?: number) => {
    const now = Date.now();
    setNowMs(now);
    setState((prev) => {
      const preset = FOCUS_PRESETS.find((p) => p.mode === prev.mode) || FOCUS_PRESETS[0];
      const mins = overrideMinutes ?? preset.breakMinutes;
      const totalMs = mins * 60 * 1000;
      return {
        ...prev,
        phase: 'break',
        status: 'running',
        totalMs,
        pausedRemainingMs: totalMs,
        targetEndMs: now + totalMs,
        startedAtIso: format(new Date(now), 'HH:mm'),
        quickNotes: [],
        distractionsLogged: 0,
        lastCompletedMinutes: 0,
        cyclesCompleted: prev.cyclesCompleted + 1,
      };
    });
  }, []);

  return {
    state,
    remainingMs,
    progressRatio,
    selectMode,
    setCustomDuration,
    setTarget,
    start,
    pause,
    extend,
    addQuickNote,
    finishEarly,
    resetToFocusIdle,
    startBreak,
  };
}

