import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';

export type PerformanceMode = 'auto' | 'full' | 'lite';

export const PERF_MODE_KEY = 'lifeos_perf_mode';
export const REDUCE_BLUR_KEY = 'lifeos_reduce_blur';

let currentPerfMode: PerformanceMode = 'auto';
let currentReduceBlur = false;

const perfListeners = new Set<() => void>();

// Initialize from localStorage or fallback
if (typeof window !== 'undefined') {
  try {
    const cachedMode = localStorage.getItem(PERF_MODE_KEY) || localStorage.getItem('lifeos_performance_mode');
    if (cachedMode === 'full' || cachedMode === 'lite' || cachedMode === 'auto') {
      currentPerfMode = cachedMode;
    }
    const cachedBlur = localStorage.getItem(REDUCE_BLUR_KEY) || localStorage.getItem('lifeos_reduce_blur_effects');
    if (cachedBlur !== null) {
      currentReduceBlur = cachedBlur === 'true';
    }
  } catch {}
}

// Sync with native capacitor preferences if available
if (typeof window !== 'undefined') {
  Preferences.get({ key: PERF_MODE_KEY }).then(({ value }) => {
    if (value === 'full' || value === 'lite' || value === 'auto') {
      if (currentPerfMode !== value) {
        currentPerfMode = value as PerformanceMode;
        notifyPerfChange();
      }
    }
  }).catch(() => {});

  Preferences.get({ key: REDUCE_BLUR_KEY }).then(({ value }) => {
    if (value !== null) {
      const boolVal = value === 'true';
      if (currentReduceBlur !== boolVal) {
        currentReduceBlur = boolVal;
        notifyPerfChange();
      }
    }
  }).catch(() => {});
}

function notifyPerfChange() {
  applyPerformanceMode();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lifeos-perf-change', {
      detail: {
        mode: currentPerfMode,
        reduceBlur: currentReduceBlur,
        effective: getEffectivePerformanceMode(),
        isLite: isLitePerformanceMode()
      }
    }));
  }
  perfListeners.forEach(fn => fn());
}

export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as any;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true;
  return false;
}

export function isAutoLiteDevice(): boolean {
  return isLowEndDevice();
}

export function getStoredPerformanceMode(): PerformanceMode {
  return currentPerfMode;
}

export function getReduceBlurEffects(): boolean {
  return currentReduceBlur;
}

export function isLitePerformanceMode(): boolean {
  if (currentReduceBlur) return true;
  if (currentPerfMode === 'lite') return true;
  if (currentPerfMode === 'full') return false;
  return isLowEndDevice();
}

export function getEffectivePerformanceMode(mode: PerformanceMode = currentPerfMode): 'full' | 'lite' {
  if (currentReduceBlur) return 'lite';
  if (mode === 'full') return 'full';
  if (mode === 'lite') return 'lite';
  return isLowEndDevice() ? 'lite' : 'full';
}

export function setReduceBlurEffects(enabled: boolean): void {
  currentReduceBlur = enabled;
  try {
    localStorage.setItem(REDUCE_BLUR_KEY, String(enabled));
    localStorage.setItem('lifeos_reduce_blur_effects', String(enabled));
  } catch {}
  Preferences.set({ key: REDUCE_BLUR_KEY, value: String(enabled) }).catch(() => {});
  notifyPerfChange();
}

export function setStoredPerformanceMode(mode: PerformanceMode): void {
  currentPerfMode = mode;
  try {
    localStorage.setItem(PERF_MODE_KEY, mode);
    localStorage.setItem('lifeos_performance_mode', mode);
  } catch {}
  Preferences.set({ key: PERF_MODE_KEY, value: mode }).catch(() => {});
  notifyPerfChange();
}

export function setPerformanceSettings(mode?: PerformanceMode, reduceBlur?: boolean) {
  if (mode !== undefined) setStoredPerformanceMode(mode);
  if (reduceBlur !== undefined) setReduceBlurEffects(reduceBlur);
}

export function applyPerformanceMode(mode: PerformanceMode = currentPerfMode): void {
  if (typeof document === 'undefined') return;
  const effective = getEffectivePerformanceMode(mode);
  const reduceBlur = currentReduceBlur;
  const root = document.documentElement;

  root.setAttribute('data-perf-mode', effective);

  if (effective === 'lite' || reduceBlur) {
    root.classList.add('perf-lite', 'reduce-blur');
    root.style.setProperty('--blur', '0px');
    root.style.setProperty('--glass-blur', 'none');
    root.style.setProperty('--card-backdrop-blur', 'none');
  } else {
    root.classList.remove('perf-lite', 'reduce-blur');
    root.style.setProperty('--blur', '24px');
    root.style.setProperty('--glass-blur', 'blur(24px) saturate(140%)');
    root.style.setProperty('--card-backdrop-blur', 'blur(24px)');
  }
}

export function applyPerfToDocument() {
  applyPerformanceMode();
}

// Initial apply
if (typeof document !== 'undefined') {
  applyPerformanceMode();
}

/**
 * Universal dual-compatible hook supporting both:
 * 1) Tuple destructuring: const [mode, setMode, effective, reduceBlur, setReduceBlur] = usePerformanceMode();
 * 2) Object destructuring: const { isLite, performanceMode, reduceBlurEffects, setPerformanceSettings } = usePerformanceMode();
 */
export function usePerformanceMode(): any {
  const [, setTick] = useState(0);

  useEffect(() => {
    applyPerformanceMode();
    const listener = () => setTick(t => t + 1);
    perfListeners.add(listener);
    return () => {
      perfListeners.delete(listener);
    };
  }, []);

  const mode = currentPerfMode;
  const reduceBlur = currentReduceBlur;
  const effective = getEffectivePerformanceMode(mode);
  const isLite = isLitePerformanceMode();

  const setMode = useCallback((newMode: PerformanceMode) => {
    setStoredPerformanceMode(newMode);
  }, []);

  const setReduceBlur = useCallback((enabled: boolean) => {
    setReduceBlurEffects(enabled);
  }, []);

  // Return a hybrid tuple/object
  const tuple: any = [mode, setMode, effective, reduceBlur, setReduceBlur];
  tuple.mode = mode;
  tuple.performanceMode = mode;
  tuple.effectiveMode = effective;
  tuple.effective = effective;
  tuple.isLite = isLite;
  tuple.reduceBlur = reduceBlur;
  tuple.reduceBlurEffects = reduceBlur;
  tuple.setMode = setMode;
  tuple.setReduceBlur = setReduceBlur;
  tuple.setPerformanceSettings = setPerformanceSettings;

  return tuple;
}
