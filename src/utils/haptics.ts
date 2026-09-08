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
    if (now - lastHapticTime < 80) return;
    lastHapticTime = now;
  }

  // Resolve vibration pattern
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

  // 1. Trigger hardware vibration if available
  let didVibrate = false;
  if ('navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      didVibrate = navigator.vibrate(vibratePattern);
    } catch {
      didVibrate = false;
    }
  }

  // 2. If vibration failed or not supported (e.g. iOS Safari), use subtle synthetic tactile audio
  if (!didVibrate) {
    const intensity = pattern === 'nav' ? 'nav' : pattern === 'heavy' ? 'heavy' : pattern === 'save' ? 'save' : pattern === 'medium' ? 'medium' : 'light';
    playSyntheticHapticAudio(intensity);
  }
}
