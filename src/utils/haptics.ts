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

export function triggerHaptic(pattern: HapticType = 'light') {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // Throttle rapid duplicate events for navigation & light taps (prevents double buzz)
  if (pattern === 'nav' || pattern === 'light') {
    if (now - lastHapticTime < 70) return;
    lastHapticTime = now;
  }

  // 1. Android / iOS Native Hardware Vibration via Capacitor Bridge
  if (Capacitor.isNativePlatform()) {
    try {
      if (pattern === 'nav') {
        Haptics.impact({ style: ImpactStyle.Light });
        return;
      } else if (pattern === 'light') {
        Haptics.impact({ style: ImpactStyle.Light });
        return;
      } else if (pattern === 'medium') {
        Haptics.impact({ style: ImpactStyle.Medium });
        return;
      } else if (pattern === 'heavy') {
        Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      } else if (pattern === 'save' || pattern === 'success') {
        Haptics.notification({ type: NotificationType.Success });
        return;
      } else if (pattern === 'ai') {
        Haptics.impact({ style: ImpactStyle.Medium });
        return;
      } else if (typeof pattern === 'number') {
        Haptics.vibrate({ duration: Math.max(10, Math.min(pattern, 400)) });
        return;
      } else if (Array.isArray(pattern)) {
        Haptics.vibrate({ duration: pattern[0] || 30 });
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
        vibratePattern = 12; // Ultra-light, gentle feedback specifically for navigation bar
        break;
      case 'light':
        vibratePattern = 18; // Softened subtle click
        break;
      case 'medium':
        vibratePattern = 35;
        break;
      case 'heavy':
        vibratePattern = 55;
        break;
      case 'save':
        vibratePattern = [25, 30, 35]; // Distinct confirmation dual pulse
        break;
      case 'success':
        vibratePattern = [20, 25, 30];
        break;
      case 'ai':
        vibratePattern = [30, 40, 35];
        break;
      default:
        vibratePattern = 18;
    }
  } else if (typeof pattern === 'number') {
    vibratePattern = pattern;
  } else if (Array.isArray(pattern)) {
    vibratePattern = pattern;
  } else {
    vibratePattern = 18;
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
