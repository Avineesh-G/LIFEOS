import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticType =
  | 'selection'
  | 'nav'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'save'
  | 'success'
  | 'warning'
  | 'error'
  | 'milestone'
  | 'ai'
  | number
  | number[];

export type HapticLevel = 'off' | 'light' | 'medium' | 'heavy';

let audioCtx: AudioContext | null = null;
let lastHapticTime = 0;
let lastHapticType: string = '';

export function getHapticLevel(): HapticLevel {
  if (typeof window === 'undefined') return 'medium';
  try {
    const saved = localStorage.getItem('lifeos_haptics_level');
    if (saved === 'off' || saved === 'light' || saved === 'medium' || saved === 'heavy') {
      return saved;
    }
    // Backward compatibility for 'high'
    if (saved === 'high') return 'heavy';
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
    const level = getHapticLevel();
    if (level === 'off') return 0;
    if (level === 'light') return 25;
    if (level === 'medium') return 50;
    if (level === 'heavy') return 80;
  } catch {}
  return 50;
}

export function setHapticIntensity(intensity: number) {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(0, Math.min(100, intensity));
    localStorage.setItem('lifeos_haptics_intensity', String(clamped));
    if (clamped === 0) {
      setHapticLevel('off');
    } else if (clamped <= 35) {
      setHapticLevel('light');
    } else if (clamped <= 65) {
      setHapticLevel('medium');
    } else {
      setHapticLevel('heavy');
    }
  } catch {}
}

/**
 * Synthesizes an ultra-crisp, acoustic micro-transient click for web / non-vibrating devices.
 * Uses a steep exponential frequency sweep mimicking high-end precision linear actuators.
 */
function playSyntheticHapticAudio(type: HapticType, volumeMultiplier = 1.0) {
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

    const isTick = type === 'selection' || type === 'nav';
    const isSave = type === 'save' || type === 'success';
    const isHeavy = type === 'heavy' || type === 'milestone';

    const freq = isTick ? 240 : isHeavy ? 80 : isSave ? 160 : 190;
    const dur = isTick ? 0.008 : isSave ? 0.024 : 0.014;
    const peakGain = (isTick ? 0.012 : isSave ? 0.03 : 0.02) * Math.min(1.5, volumeMultiplier);

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + dur);

    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + dur);
  } catch {}
}

/**
 * Ultra-crisp web fallback durations (in milliseconds).
 * Short pulses avoid the sluggish inertia of coarse phone motors.
 */
const CRISP_WEB_PULSES: Record<string, number | number[]> = {
  selection: 8,
  nav: 10,
  light: 12,
  medium: 18,
  heavy: 28,
  save: [16, 40, 10],
  milestone: [22, 45, 18],
  success: [14, 45, 20],
  warning: [20, 45, 16],
  error: [22, 35, 22, 35, 26],
  ai: [8, 35, 14],
};

/**
 * Central trigger for crisp, tactile, hardware-aligned haptic feedback across LifeOS.
 */
export function triggerHaptic(pattern: HapticType = 'medium') {
  if (typeof window === 'undefined') return;

  const level = getHapticLevel();
  if (level === 'off') return;

  const patternStr = typeof pattern === 'string' ? pattern : 'custom';
  const now = Date.now();

  // Tight debounce for selection ticks (e.g. dragging the navbar droplet), 30ms for button taps
  const minInterval = patternStr === 'selection' ? 18 : 30;
  if (now - lastHapticTime < minInterval && lastHapticType === patternStr) {
    return;
  }
  lastHapticTime = now;
  lastHapticType = patternStr;

  // 1. Android & iOS Hardware Linear Actuator (Taptic Engine / LRA) via Capacitor Bridge
  if (Capacitor.isNativePlatform()) {
    try {
      if (pattern === 'selection') {
        // High-precision mechanical tick / detent
        Haptics.selectionChanged().catch(() => {
          Haptics.impact({ style: ImpactStyle.Light });
        });
        return;
      }

      if (pattern === 'nav' || pattern === 'light') {
        // Crisp, lightweight button/toggle touch
        const style = level === 'heavy' ? ImpactStyle.Medium : ImpactStyle.Light;
        Haptics.impact({ style });
        return;
      }

      if (pattern === 'medium') {
        // Confident, solid mechanical click
        const style = level === 'light' ? ImpactStyle.Light : level === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium;
        Haptics.impact({ style });
        return;
      }

      if (pattern === 'heavy' || pattern === 'milestone') {
        // Authoritative deep tactile impact
        const style = level === 'light' ? ImpactStyle.Medium : ImpactStyle.Heavy;
        Haptics.impact({ style });
        return;
      }

      if (pattern === 'save') {
        // Dual-pulse ratchet lock-in: firm click followed by crisp detent snap
        Haptics.impact({ style: ImpactStyle.Medium });
        setTimeout(() => {
          Haptics.impact({ style: ImpactStyle.Light });
        }, 45);
        return;
      }

      if (pattern === 'ai') {
        // Futuristic double-tick sparkle
        Haptics.selectionChanged().catch(() => {
          Haptics.impact({ style: ImpactStyle.Light });
        });
        setTimeout(() => {
          Haptics.impact({ style: ImpactStyle.Light });
        }, 40);
        return;
      }

      if (pattern === 'success') {
        Haptics.notification({ type: NotificationType.Success });
        return;
      }

      if (pattern === 'warning') {
        Haptics.notification({ type: NotificationType.Warning });
        return;
      }

      if (pattern === 'error') {
        Haptics.notification({ type: NotificationType.Error });
        return;
      }

      // Fallback for custom number durations
      if (typeof pattern === 'number') {
        const style = pattern <= 15 ? ImpactStyle.Light : pattern <= 35 ? ImpactStyle.Medium : ImpactStyle.Heavy;
        Haptics.impact({ style });
        return;
      }
    } catch {
      // Fall through to web vibration API below
    }
  }

  // 2. Web Vibration API Fallback (Ultra-crisp micro-pulses)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (typeof pattern === 'string' && CRISP_WEB_PULSES[pattern]) {
        navigator.vibrate(CRISP_WEB_PULSES[pattern]);
      } else if (typeof pattern === 'number') {
        navigator.vibrate(Math.min(30, pattern));
      } else if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(14);
      }
    } catch {}
  }

  // 3. Acoustic Feedback for non-touch / web environments
  if (typeof pattern === 'string') {
    playSyntheticHapticAudio(pattern);
  }
}

/**
 * Ergonomic 5-tier haptic helper object for tactile UI interactions across LifeOS.
 */
export const haptics = {
  tick: () => triggerHaptic('selection'),
  tap: () => triggerHaptic('light'),
  snap: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  milestone: () => triggerHaptic('milestone'),
  save: () => triggerHaptic('save'),
  ai: () => triggerHaptic('ai'),
};
