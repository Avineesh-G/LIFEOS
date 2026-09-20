import { useState, useEffect, useCallback } from 'react';

export type PerformanceMode = 'auto' | 'full' | 'lite';

const STORAGE_KEY = 'lifeos_performance_mode';

/**
 * Detects if the current device is low-end based on CPU concurrency and RAM.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Logical CPU cores <= 4 typically indicates entry-level mobile SOC
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }

  // Device memory <= 4GB (Device Memory API)
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

export function setStoredPerformanceMode(mode: PerformanceMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode);
  applyPerformanceMode(mode);
}

export function getEffectivePerformanceMode(mode: PerformanceMode = getStoredPerformanceMode()): 'full' | 'lite' {
  if (mode === 'full') return 'full';
  if (mode === 'lite') return 'lite';
  return isLowEndDevice() ? 'lite' : 'full';
}

export function applyPerformanceMode(mode: PerformanceMode = getStoredPerformanceMode()): void {
  if (typeof document === 'undefined') return;
  const effective = getEffectivePerformanceMode(mode);
  document.documentElement.setAttribute('data-perf-mode', effective);
  if (effective === 'lite') {
    document.documentElement.classList.add('perf-lite');
  } else {
    document.documentElement.classList.remove('perf-lite');
  }
}

/**
 * React hook to read and change Performance Mode.
 */
export function usePerformanceMode(): [
  PerformanceMode,
  (newMode: PerformanceMode) => void,
  'full' | 'lite'
] {
  const [mode, setModeState] = useState<PerformanceMode>(getStoredPerformanceMode);
  const [effective, setEffective] = useState<'full' | 'lite'>(() => getEffectivePerformanceMode(mode));

  const setMode = useCallback((newMode: PerformanceMode) => {
    setModeState(newMode);
    setStoredPerformanceMode(newMode);
    const nextEffective = getEffectivePerformanceMode(newMode);
    setEffective(nextEffective);
  }, []);

  useEffect(() => {
    applyPerformanceMode(mode);
    setEffective(getEffectivePerformanceMode(mode));
  }, [mode]);

  return [mode, setMode, effective];
}
