import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

export interface SecurityConfig {
  enabled: boolean;
}

const STORAGE_KEY = 'lifeos_app_security_v2';
const LOCK_STATE_KEY = 'lifeos_is_locked_session';
const LAST_UNLOCK_KEY = 'lifeos_last_unlock_time';
const LAST_BACKGROUND_KEY = 'lifeos_last_background_time';

// Hardcoded 60s cooldown grace period in code (not in settings page)
const COOLDOWN_MS = 60 * 1000;

// Internal flag to prevent Android BiometricPrompt from triggering background/foreground locks
let isBiometricPromptActive = false;

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

// ── Background / Foreground Cooldown Handlers (60s Default) ────────────────
export function recordUnlockTime() {
  if (typeof window === 'undefined') return;
  const now = Date.now().toString();
  localStorage.setItem(LAST_UNLOCK_KEY, now);
  // Clear background time so returning doesn't immediately re-lock
  localStorage.removeItem(LAST_BACKGROUND_KEY);
  sessionStorage.setItem(LOCK_STATE_KEY, 'false');
}

export function handleAppBackgrounded() {
  if (typeof window === 'undefined') return;
  // If biometric dialog is active or app is already locked, do not record backgrounding
  if (isBiometricPromptActive) return;
  const config = getSecurityConfig();
  if (!config.enabled) return;

  const now = Date.now().toString();
  localStorage.setItem(LAST_BACKGROUND_KEY, now);
}

export function handleAppForegrounded() {
  if (typeof window === 'undefined') return;
  // If biometric dialog just finished, do not treat as an app resume
  if (isBiometricPromptActive) return;
  const config = getSecurityConfig();
  if (!config.enabled) return;

  const lastBgRaw = localStorage.getItem(LAST_BACKGROUND_KEY);
  if (!lastBgRaw) return;

  const lastBg = parseInt(lastBgRaw, 10);
  const elapsed = Date.now() - lastBg;

  // Clear the background timestamp once evaluated
  localStorage.removeItem(LAST_BACKGROUND_KEY);

  // Only lock if minimized for longer than the 60s cooldown
  if (elapsed >= COOLDOWN_MS) {
    setAppLocked(true);
  }
}

// ── Authentication Service ─────────────────────────────────────────────────
export async function authenticateDeviceLock(
  subtitle = 'Unlock with your phone’s fingerprint or screen lock'
): Promise<{ success: boolean; error?: string }> {
  isBiometricPromptActive = true;
  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Verify plugin is present on native bridge
      if (!Capacitor.isPluginAvailable('NativeBiometric')) {
        return {
          success: false,
          error: 'Native phone lock requires installing the updated LifeOS APK on your device. Please download and install the update from Settings.',
        };
      }

      // 2. Verify availability first (fallback: true accounts for PIN/pattern/password)
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
            error: 'Native phone lock requires installing the updated LifeOS APK on your device. Please download and install the update from Settings.',
          };
        }
        console.warn('NativeBiometric.isAvailable warning, proceeding to verifyIdentity:', err);
      }

      // 3. Perform native BiometricPrompt verification
      await NativeBiometric.verifyIdentity({
        title: 'LifeOS Protected',
        subtitle,
        reason: 'Verify your phone lock to proceed',
        negativeButtonText: 'Cancel',
        allowedBiometryTypes: [
          BiometryType.FINGERPRINT,
          BiometryType.FACE_AUTHENTICATION,
          BiometryType.DEVICE_CREDENTIAL,
        ],
        useFallback: true,
      });

      localStorage.removeItem(LAST_BACKGROUND_KEY);
      sessionStorage.setItem(LOCK_STATE_KEY, 'false');
      recordUnlockTime();
      setAppLocked(false);
      return { success: true };
    }

    // 4. Web / Dev environment fallback
    localStorage.removeItem(LAST_BACKGROUND_KEY);
    sessionStorage.setItem(LOCK_STATE_KEY, 'false');
    recordUnlockTime();
    setAppLocked(false);
    return { success: true };
  } catch (err: any) {
    const msg = err?.message || err?.toString() || 'Authentication canceled';
    const lower = msg.toLowerCase();
    if (
      lower.includes('cancel') ||
      lower.includes('user canceled') ||
      lower.includes('cancelled')
    ) {
      return { success: false, error: 'Authentication canceled' };
    }
    if (msg.includes('not implemented')) {
      return {
        success: false,
        error: 'Native phone lock requires installing the updated LifeOS APK on your device. Please download and install the update from Settings.',
      };
    }
    return { success: false, error: msg };
  } finally {
    // Keep flag true for 600ms buffer while Android window focus stabilizes
    setTimeout(() => {
      isBiometricPromptActive = false;
    }, 600);
  }
}

export async function isDeviceLockAvailable(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    if (!Capacitor.isPluginAvailable('NativeBiometric')) return false;
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
  if (val === 'false') {
    return false;
  }

  // Cold launch: check if last unlock happened recently within 60s cooldown
  const lastUnlockRaw = localStorage.getItem(LAST_UNLOCK_KEY);
  if (lastUnlockRaw) {
    const lastUnlock = parseInt(lastUnlockRaw, 10);
    const elapsed = Date.now() - lastUnlock;
    if (elapsed < COOLDOWN_MS) {
      sessionStorage.setItem(LOCK_STATE_KEY, 'false');
      return false;
    }
  }

  return val === null ? true : val === 'true';
}

export function setAppLocked(locked: boolean) {
  const config = getSecurityConfig();
  if (!config.enabled && locked) return;
  sessionStorage.setItem(LOCK_STATE_KEY, locked ? 'true' : 'false');
  if (!locked) {
    recordUnlockTime();
  }
  lockStateListeners.forEach((listener) => listener(locked));
}

export function subscribeToLockState(listener: (locked: boolean) => void): () => void {
  lockStateListeners.push(listener);
  return () => {
    lockStateListeners = lockStateListeners.filter((l) => l !== listener);
  };
}
