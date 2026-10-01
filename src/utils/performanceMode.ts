import { useState, useEffect, useCallback } from 'react';

export type PerformanceMode = 'auto' | 'full' | 'lite';

const STORAGE_KEY = 'lifeos_performance_mode';
const REDUCE_BLUR_KEY = 'lifeos_reduce_blur_effects';

export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  const deviceMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (typeof deviceMem === 'number' && deviceMem <= 4) {
    return true;
  }
  return false;
}

export function getStoredPerformanceMode(): PerformanceMode {
  if (typeof window === 'undefined') return 'auto';
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'full' || val === 'lite' || val === 'auto') {
    return val;
  }
  return 'auto';
}

export function getReduceBlurEffects(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REDUCE_BLUR_KEY) === 'true';
}

export function setReduceBlurEffects(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REDUCE_BLUR_KEY, String(enabled));
  applyPerformanceMode();
}

export function setStoredPerformanceMode(mode: PerformanceMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode);
  applyPerformanceMode(mode);
}

export function getEffectivePerformanceMode(mode: PerformanceMode = getStoredPerformanceMode()): 'full' | 'lite' {
  if (getReduceBlurEffects()) return 'lite';
  if (mode === 'full') return 'full';
  if (mode === 'lite') return 'lite';
  return isLowEndDevice() ? 'lite' : 'full';
}

export function applyPerformanceMode(mode: PerformanceMode = getStoredPerformanceMode()): void {
  if (typeof document === 'undefined') return;
  const effective = getEffectivePerformanceMode(mode);
  const reduceBlur = getReduceBlurEffects();

  document.documentElement.setAttribute('data-perf-mode', effective);
  
  if (effective === 'lite' || reduceBlur) {
    document.documentElement.classList.add('perf-lite', 'reduce-blur');
    document.documentElement.style.setProperty('--blur', '0px');
    document.documentElement.style.setProperty('--glass-blur', 'none');
    document.documentElement.style.setProperty('--card-backdrop-blur', 'none');
  } else {
    document.documentElement.classList.remove('perf-lite', 'reduce-blur');
    document.documentElement.style.setProperty('--blur', '24px');
    document.documentElement.style.setProperty('--glass-blur', 'blur(24px) saturate(140%)');
    document.documentElement.style.setProperty('--card-backdrop-blur', 'blur(24px)');
  }
}

export function usePerformanceMode(): [
  PerformanceMode,
  (newMode: PerformanceMode) => void,
  'full' | 'lite',
  boolean,
  (reduceBlur: boolean) => void
] {
  const [mode, setModeState] = useState<PerformanceMode>(getStoredPerformanceMode);
  const [reduceBlur, setReduceBlurState] = useState<boolean>(getReduceBlurEffects);
  const [effective, setEffective] = useState<'full' | 'lite'>(() => getEffectivePerformanceMode(mode));

  const setMode = useCallback((newMode: PerformanceMode) => {
    setModeState(newMode);
    setStoredPerformanceMode(newMode);
    setEffective(getEffectivePerformanceMode(newMode));
  }, []);

  const setReduceBlur = useCallback((enabled: boolean) => {
    setReduceBlurState(enabled);
    setReduceBlurEffects(enabled);
    setEffective(getEffectivePerformanceMode(mode));
  }, [mode]);

  useEffect(() => {
    applyPerformanceMode(mode);
    setEffective(getEffectivePerformanceMode(mode));
  }, [mode, reduceBlur]);

  return [mode, setMode, effective, reduceBlur, setReduceBlur];
}

