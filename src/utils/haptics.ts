export function triggerHaptic(pattern: number | number[] = 12) {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore browser restrictions or unsupported devices
    }
  }
}
