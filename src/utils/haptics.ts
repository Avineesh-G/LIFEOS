export type HapticType = 'light' | 'medium' | 'heavy' | 'save' | 'success' | 'ai' | number | number[];

let audioCtx: AudioContext | null = null;

function playSyntheticHapticAudio(intensity: 'light' | 'medium' | 'heavy' | 'save') {
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

    const freq = intensity === 'heavy' ? 70 : intensity === 'save' ? 110 : 140;
    const dur = intensity === 'save' ? 0.04 : 0.02;

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);

    gain.gain.setValueAtTime(0.04, now);
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

  // Resolve vibration pattern
  let vibratePattern: number | number[];

  if (typeof pattern === 'string') {
    switch (pattern) {
      case 'light':
        vibratePattern = 30; // Min 30ms for Android motor ramp-up
        break;
      case 'medium':
        vibratePattern = 45;
        break;
      case 'heavy':
        vibratePattern = 65;
        break;
      case 'save':
        vibratePattern = [35, 40, 50]; // Distinct confirmation dual pulse
        break;
      case 'success':
        vibratePattern = [30, 35, 40];
        break;
      case 'ai':
        vibratePattern = [40, 50, 45];
        break;
      default:
        vibratePattern = 30;
    }
  } else if (typeof pattern === 'number') {
    // Boost legacy short millisecond values (5, 8, 10, 12, 15) to audible/tactile Android thresholds
    vibratePattern = pattern < 25 ? 30 : pattern < 40 ? 45 : pattern;
  } else if (Array.isArray(pattern)) {
    vibratePattern = pattern.map(p => (p < 20 ? 30 : p));
  } else {
    vibratePattern = 30;
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
    const intensity = pattern === 'heavy' ? 'heavy' : pattern === 'save' ? 'save' : pattern === 'medium' ? 'medium' : 'light';
    playSyntheticHapticAudio(intensity);
  }
}
