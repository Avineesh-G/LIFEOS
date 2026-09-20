import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticType = 'nav' | 'light' | 'medium' | 'heavy' | 'save' | 'success' | 'error' | 'milestone' | 'ai' | 'selection' | number | number[];

let audioCtx: AudioContext | null = null;
let lastHapticTime = 0;

export type HapticLevel = 'off' | 'medium' | 'high';

export function getHapticLevel(): HapticLevel {
  if (typeof window === 'undefined') return 'medium';
  try {
    const saved = localStorage.getItem('lifeos_haptics_level');
    if (saved === 'off' || saved === 'medium') {
      return saved;
    }
    if (saved === 'high') {
      return 'medium';
    }
  } catch {}
  return 'medium';
}

export function setHapticLevel(level: HapticLevel) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('lifeos_haptics_level', level);
  } catch {}
}

export function getHapticIntensity(): number {
  if (typeof window === 'undefined') return 50;
  try {
    const saved = localStorage.getItem('lifeos_haptics_intensity');
    if (saved !== null) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 0 && num <= 100) return num;
    }
    const level = localStorage.getItem('lifeos_haptics_level');
    if (level === 'off') return 0;
    return 50;
  } catch {}
  return 50;
}

export function setHapticIntensity(intensity: number) {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(0, Math.min(100, intensity));
    localStorage.setItem('lifeos_haptics_intensity', String(clamped));
    if (clamped === 0) {
      localStorage.setItem('lifeos_haptics_level', 'off');
    } else {
      localStorage.setItem('lifeos_haptics_level', 'medium');
    }
  } catch {}
}

/**
 * Calculates tactile multiplier from the haptics volume bar (0 - 100).
 * Default setting is 50% (1.0X baseline; keep default value same).
 * Increasing slider above 50% adds up to +0.9X (1.9X at 100%).
 * Decreasing slider below 50% smoothly lowers intensity.
 */
export function getHapticMultiplier(intensity = getHapticIntensity()): number {
  if (intensity <= 0) return 0;
  const boost = intensity >= 50
    ? ((intensity - 50) / 50) * 0.9
    : -((50 - intensity) / 50) * 0.7;
  return Math.max(0.1, 1.0 + boost);
}

function playSyntheticHapticAudio(intensity: 'nav' | 'light' | 'medium' | 'heavy' | 'save', multiplier = 1.0) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    const now = audioCtx.currentTime;

    const freq = intensity === 'nav' ? 170 : intensity === 'heavy' ? 70 : intensity === 'save' ? 110 : 140;
    const dur = intensity === 'nav' ? 0.012 : intensity === 'save' ? 0.035 : 0.018;
    const peakGain = (intensity === 'nav' ? 0.012 : intensity === 'save' ? 0.04 : 0.02) * Math.min(2.0, multiplier);

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);

    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + dur);
  } catch {
    // Ignore audio restrictions
  }
}

const BASE_DURATIONS: Record<string, number> = {
  selection: 10,
  nav: 15,
  light: 18,
  medium: 30,
  heavy: 48,
  save: 48,
  milestone: 50,
  success: 35,
  error: 45,
  ai: 25,
};

export function triggerHaptic(pattern: HapticType = 'light') {
  if (typeof window === 'undefined') return;

  const intensity = getHapticIntensity();
  if (intensity <= 0) return;

  const now = Date.now();
  if (now - lastHapticTime < 40) return;
  lastHapticTime = now;

  const multiplier = getHapticMultiplier(intensity);

  // Compute scaled duration
  let baseDuration = 18;
  if (typeof pattern === 'number') {
    baseDuration = pattern;
  } else if (!Array.isArray(pattern) && BASE_DURATIONS[pattern]) {
    baseDuration = BASE_DURATIONS[pattern];
  }
  const scaledDuration = Math.round(baseDuration * multiplier);

  // 1. Android / iOS Native Hardware Vibration via Capacitor Bridge
  if (Capacitor.isNativePlatform()) {
    try {
      if (pattern === 'selection') {
        if (intensity > 60) {
          Haptics.vibrate({ duration: scaledDuration });
        } else {
          Haptics.selectionStart();
        }
      } else if (pattern === 'success') {
        Haptics.notification({ type: NotificationType.Success });
      } else if (pattern === 'error') {
        Haptics.notification({ type: NotificationType.Error });
      } else if (intensity > 70) {
        // High / Max boost intensity: trigger direct motor vibration with scaled duration
        Haptics.vibrate({ duration: scaledDuration });
      } else if (pattern === 'heavy' || pattern === 'milestone') {
        Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (pattern === 'medium' || pattern === 'save') {
        Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        Haptics.impact({ style: intensity >= 50 ? ImpactStyle.Medium : ImpactStyle.Light });
      }
      return;
    } catch {
      // Fallback to browser web APIs below
    }
  }

  // 2. Web / Browser fallback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (Array.isArray(pattern)) {
        const scaledPattern = pattern.map(p => Math.round(p * multiplier));
        navigator.vibrate(scaledPattern);
      } else if (pattern === 'error') {
        navigator.vibrate([scaledDuration, 60, scaledDuration]);
      } else {
        navigator.vibrate(scaledDuration);
      }
    } catch {}
  }

  // 3. Audio feedback
  if (typeof pattern === 'string' && (pattern === 'nav' || pattern === 'light' || pattern === 'medium' || pattern === 'heavy' || pattern === 'save')) {
    playSyntheticHapticAudio(pattern, multiplier);
  }
}
