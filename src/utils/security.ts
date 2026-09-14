import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export interface SecurityConfig {
  enabled: boolean;
}

const STORAGE_KEY = 'lifeos_app_security_v2';
const LOCK_STATE_KEY = 'lifeos_is_locked_session';

const DEFAULT_CONFIG: SecurityConfig = {
  enabled: false,
};

// ── Configuration Persistence ──────────────────────────────────────────────
export function getSecurityConfig(): SecurityConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveSecurityConfig(config: Partial<SecurityConfig>): SecurityConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  const current = getSecurityConfig();
  const updated: SecurityConfig = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('lifeos-security-config-changed', { detail: updated }));
  return updated;
}

// ── Authentication Service ─────────────────────────────────────────────────
export async function authenticateDeviceLock(
  subtitle = 'Unlock with your phone’s fingerprint or screen lock'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Verify availability first
      try {
        const check = await NativeBiometric.isAvailable({ useFallback: true });
        if (!check.isAvailable && !check.deviceIsSecure) {
          return {
            success: false,
            error: 'No phone screen lock set up. Please set a PIN, pattern, or fingerprint in Android Settings.',
          };
        }
      } catch (err: any) {
        if (err?.message?.includes('not implemented')) {
          return {
            success: false,
            error: 'Native phone lock requires installing the updated LifeOS APK on your device. Please install the APK update from Settings.',
          };
        }
      }

      // 2. Perform native BiometricPrompt verification
      await NativeBiometric.verifyIdentity({
        title: 'LifeOS Protected',
        subtitle,
        reason: 'Verify your phone lock to proceed',
        negativeButtonText: 'Cancel',
        useFallback: true,
      });

      setAppLocked(false);
      return { success: true };
    }

    // 3. Web / Dev environment fallback
    setAppLocked(false);
    return { success: true };
  } catch (err: any) {
    const msg = err?.message || err?.toString() || 'Authentication canceled';
    if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('user canceled')) {
      return { success: false, error: 'Authentication canceled' };
    }
    if (msg.includes('not implemented')) {
      return {
        success: false,
        error: 'Native phone lock requires installing the updated LifeOS APK on your device. Please install the APK update from Settings.',
      };
    }
    return { success: false, error: msg };
  }
}

export async function isDeviceLockAvailable(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeBiometric.isAvailable({ useFallback: true });
      return !!(res.isAvailable || res.deviceIsSecure);
    } catch {
      return false;
    }
  }
  return true;
}

// ── Lock State Control (Session) ───────────────────────────────────────────
let lockStateListeners: Array<(locked: boolean) => void> = [];

export function isAppLocked(): boolean {
  const config = getSecurityConfig();
  if (!config.enabled) return false;
  const val = sessionStorage.getItem(LOCK_STATE_KEY);
  return val === null ? true : val === 'true';
}

export function setAppLocked(locked: boolean) {
  const config = getSecurityConfig();
  if (!config.enabled && locked) return;
  sessionStorage.setItem(LOCK_STATE_KEY, locked ? 'true' : 'false');
  lockStateListeners.forEach((listener) => listener(locked));
}

export function subscribeToLockState(listener: (locked: boolean) => void): () => void {
  lockStateListeners.push(listener);
  return () => {
    lockStateListeners = lockStateListeners.filter((l) => l !== listener);
  };
}
