import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticType = 'nav' | 'light' | 'medium' | 'heavy' | 'save' | 'success' | 'error' | 'milestone' | 'ai' | 'selection' | number | number[];

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
  if (typeof window === 'undefined') return 100;
  try {
    const saved = localStorage.getItem('lifeos_haptics_intensity');
    if (saved !== null) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 0 && num <= 100) return num;
    }
    const level = getHapticLevel();
    return level === 'off' ? 0 : 100;
  } catch {}
  return 100;
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

export function triggerHaptic(pattern: HapticType = 'light') {
  if (typeof window === 'undefined') return;

  const level = getHapticLevel();
  if (level === 'off') return;

  const now = Date.now();
  if (now - lastHapticTime < 45) return;
  lastHapticTime = now;

  const isHigh = level === 'high';

  // 1. Android / iOS Native Hardware Vibration via Capacitor Bridge
  if (Capacitor.isNativePlatform()) {
    try {
      if (pattern === 'heavy' || pattern === 'milestone') {
        Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (pattern === 'medium' || pattern === 'save') {
        Haptics.impact({ style: ImpactStyle.Medium });
      } else if (pattern === 'success') {
        Haptics.notification({ type: NotificationType.Success });
      } else if (pattern === 'error') {
        Haptics.notification({ type: NotificationType.Error });
      } else if (pattern === 'selection') {
        Haptics.selectionStart();
      } else {
        Haptics.impact({ style: isHigh ? ImpactStyle.Medium : ImpactStyle.Light });
      }
      return;
    } catch {
      // Fallback to browser web APIs below
    }
  }

  // 2. Web / Browser fallback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (typeof pattern === 'number') {
        navigator.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else if (pattern === 'heavy' || pattern === 'milestone') {
        navigator.vibrate(30);
      } else if (pattern === 'medium' || pattern === 'save') {
        navigator.vibrate(20);
      } else if (pattern === 'error') {
        // Double-pulse — perceptibly different from success single-pulse
        navigator.vibrate([20, 60, 20]);
      } else if (pattern === 'selection') {
        navigator.vibrate(8);
      } else {
        navigator.vibrate(isHigh ? 18 : 12);
      }
    } catch {}
  }
}

