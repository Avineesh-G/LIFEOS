import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export type PerformanceMode = 'auto' | 'full' | 'lite';

export const PERF_MODE_KEY = 'lifeos_perf_mode';
export const REDUCE_BLUR_KEY = 'lifeos_reduce_blur';

let currentPerfMode: PerformanceMode = 'auto';
let currentReduceBlur = false;

const perfListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  try {
    const cachedMode = localStorage.getItem(PERF_MODE_KEY);
    if (cachedMode === 'full' || cachedMode === 'lite' || cachedMode === 'auto') {
      currentPerfMode = cachedMode;
    }
    const cachedBlur = localStorage.getItem(REDUCE_BLUR_KEY);
    if (cachedBlur !== null) {
      currentReduceBlur = cachedBlur === 'true';
    }
  } catch {}
}

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

function notifyPerfChange() {
  applyPerfToDocument();
  perfListeners.forEach(fn => fn());
}

export function isAutoLiteDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as any;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true;
  return false;
}

export function isLitePerformanceMode(): boolean {
  if (currentReduceBlur) return true;
  if (currentPerfMode === 'lite') return true;
  if (currentPerfMode === 'full') return false;
  return isAutoLiteDevice();
}

export function applyPerfToDocument() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const lite = isLitePerformanceMode();

  if (lite) {
    root.classList.add('reduce-blur');
    root.style.setProperty('--blur', '0px');
    root.style.setProperty('--glass-blur', 'none');
    root.style.setProperty('--card-backdrop-blur', 'none');
  } else {
    root.classList.remove('reduce-blur');
    root.style.setProperty('--blur', '24px');
    root.style.setProperty('--glass-blur', 'blur(24px) saturate(140%)');
    root.style.setProperty('--card-backdrop-blur', 'blur(24px)');
  }
}

export function setPerformanceSettings(mode?: PerformanceMode, reduceBlur?: boolean) {
  let changed = false;
  if (mode !== undefined && mode !== currentPerfMode) {
    currentPerfMode = mode;
    try { localStorage.setItem(PERF_MODE_KEY, mode); } catch {}
    Preferences.set({ key: PERF_MODE_KEY, value: mode }).catch(() => {});
    changed = true;
  }
  if (reduceBlur !== undefined && reduceBlur !== currentReduceBlur) {
    currentReduceBlur = reduceBlur;
    try { localStorage.setItem(REDUCE_BLUR_KEY, String(reduceBlur)); } catch {}
    Preferences.set({ key: REDUCE_BLUR_KEY, value: String(reduceBlur) }).catch(() => {});
    changed = true;
  }
  if (changed) {
    notifyPerfChange();
  }
}

export function usePerformanceMode() {
  const [, setTick] = useState(0);

  useEffect(() => {
    applyPerfToDocument();
    const listener = () => setTick(t => t + 1);
    perfListeners.add(listener);
    return () => {
      perfListeners.delete(listener);
    };
  }, []);

  const isLite = isLitePerformanceMode();

  return {
    performanceMode: currentPerfMode,
    reduceBlurEffects: currentReduceBlur,
    isLite,
    setPerformanceSettings,
  };
}
