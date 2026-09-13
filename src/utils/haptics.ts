import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticType = 'nav' | 'light' | 'medium' | 'heavy' | 'save' | 'success' | 'ai' | number | number[];

let audioCtx: AudioContext | null = null;
let lastHapticTime = 0;

function playSyntheticHapticAudio(intensity: 'nav' | 'light' | 'medium' | 'heavy' | 'save') {
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
    const peakGain = intensity === 'nav' ? 0.012 : intensity === 'save' ? 0.04 : 0.02;

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

export type HapticLevel = 'off' | 'medium' | 'high';

export function getHapticLevel(): HapticLevel {
  if (typeof window === 'undefined') return 'medium';
  try {
    const saved = localStorage.getItem('lifeos_haptics_level');
    if (saved === 'off' || saved === 'medium' || saved === 'high') {
      return saved;
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

export function triggerHaptic(pattern: HapticType = 'light') {
  if (typeof window === 'undefined') return;

  const level = getHapticLevel();
  if (level === 'off') return;

  const now = Date.now();
  // Throttle rapid duplicate events for navigation & light taps (prevents double buzz)
  if (pattern === 'nav' || pattern === 'light') {
    if (now - lastHapticTime < 70) return;
    lastHapticTime = now;
  }

  const isHigh = level === 'high';

  // 1. Android / iOS Native Hardware Vibration via Capacitor Bridge
  if (Capacitor.isNativePlatform()) {
    try {
      if (pattern === 'nav') {
        Haptics.impact({ style: isHigh ? ImpactStyle.Medium : ImpactStyle.Light });
        return;
      } else if (pattern === 'light') {
        Haptics.impact({ style: isHigh ? ImpactStyle.Medium : ImpactStyle.Light });
        return;
      } else if (pattern === 'medium') {
        Haptics.impact({ style: isHigh ? ImpactStyle.Heavy : ImpactStyle.Medium });
        return;
      } else if (pattern === 'heavy') {
        Haptics.impact({ style: ImpactStyle.Heavy });
        if (isHigh) {
          setTimeout(() => {
            Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
          }, 60);
        }
        return;
      } else if (pattern === 'save' || pattern === 'success') {
        Haptics.notification({ type: NotificationType.Success });
        return;
      } else if (pattern === 'ai') {
        Haptics.impact({ style: isHigh ? ImpactStyle.Heavy : ImpactStyle.Medium });
        return;
      } else if (typeof pattern === 'number') {
        const mult = isHigh ? 1.5 : 1;
        Haptics.vibrate({ duration: Math.max(10, Math.min(Math.round(pattern * mult), 400)) });
        return;
      } else if (Array.isArray(pattern)) {
        const dur = pattern[0] || 30;
        const mult = isHigh ? 1.5 : 1;
        Haptics.vibrate({ duration: Math.round(dur * mult) });
        return;
      }
    } catch {
      // Fallback to browser web APIs below if native bridge is not ready
    }
  }

  // 2. Web / Browser fallback
  let vibratePattern: number | number[];

  if (typeof pattern === 'string') {
    switch (pattern) {
      case 'nav':
        vibratePattern = isHigh ? 20 : 12;
        break;
      case 'light':
        vibratePattern = isHigh ? 26 : 18;
        break;
      case 'medium':
        vibratePattern = isHigh ? 50 : 35;
        break;
      case 'heavy':
        vibratePattern = isHigh ? 80 : 55;
        break;
      case 'save':
        vibratePattern = isHigh ? [35, 40, 50] : [25, 30, 35];
        break;
      case 'success':
        vibratePattern = isHigh ? [30, 35, 45] : [20, 25, 30];
        break;
      case 'ai':
        vibratePattern = isHigh ? [45, 55, 50] : [30, 40, 35];
        break;
      default:
        vibratePattern = isHigh ? 26 : 18;
    }
  } else if (typeof pattern === 'number') {
    vibratePattern = isHigh ? Math.round(pattern * 1.5) : pattern;
  } else if (Array.isArray(pattern)) {
    vibratePattern = isHigh ? pattern.map(n => Math.round(n * 1.5)) : pattern;
  } else {
    vibratePattern = isHigh ? 26 : 18;
  }

  let didVibrate = false;
  if ('navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      didVibrate = navigator.vibrate(vibratePattern);
    } catch {
      didVibrate = false;
    }
  }

  // 3. Synthetic tactile audio fallback for desktop browsers
  if (!didVibrate) {
    const intensity = pattern === 'nav' ? 'nav' : pattern === 'heavy' ? 'heavy' : pattern === 'save' ? 'save' : pattern === 'medium' ? 'medium' : 'light';
    playSyntheticHapticAudio(intensity);
  }
}
