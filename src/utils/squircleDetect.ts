/**
 * Squircle Capability Detector & WebView Environment Inspector
 */

export interface SquircleSupportInfo {
  isNativeSupported: boolean;
  mode: 'native' | 'round';
  webViewVersion: string;
  userAgent: string;
}

export function detectSquircleSupport(): SquircleSupportInfo {
  if (typeof window === 'undefined') {
    return {
      isNativeSupported: false,
      mode: 'round',
      webViewVersion: 'Unknown',
      userAgent: '',
    };
  }

  const ua = navigator.userAgent;
  let isSupported = false;

  try {
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      isSupported = CSS.supports('corner-shape', 'squircle') || CSS.supports('corner-shape: squircle');
    }
  } catch {
    isSupported = false;
  }

  // Fallback check on documentElement style
  if (!isSupported && typeof document !== 'undefined') {
    const testEl = document.createElement('div');
    isSupported = 'cornerShape' in testEl.style || 'corner-shape' in testEl.style;
  }

  // Extract Android WebView / Chrome Version from User Agent
  let webViewVersion = 'Native Web Context';
  const chromeMatch = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
  const versionMatch = ua.match(/Version\/(\d+\.\d+)/);

  if (chromeMatch) {
    const majorVersion = parseInt(chromeMatch[1].split('.')[0], 10);
    webViewVersion = `Chrome / WebView v${chromeMatch[1]} (Major ${majorVersion})`;
  } else if (versionMatch) {
    webViewVersion = `Android System WebView ${versionMatch[1]}`;
  }

  const mode: 'native' | 'round' = isSupported ? 'native' : 'round';

  // Apply data attribute to root html element for global CSS targeting
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-squircle', mode);
  }

  return {
    isNativeSupported: isSupported,
    mode,
    webViewVersion,
    userAgent: ua,
  };
}
