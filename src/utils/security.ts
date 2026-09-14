import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

export type LockCooldown = 'immediate' | '1min' | '5min' | '15min' | 'session';

export interface SecurityConfig {
  enabled: boolean;
  cooldown: LockCooldown;
  customPinEnabled?: boolean;
  customPin?: string;
  patternEnabled?: boolean;
}

const STORAGE_KEY = 'lifeos_app_security_v2';
const LOCK_STATE_KEY = 'lifeos_is_locked_session';
const LAST_UNLOCK_KEY = 'lifeos_last_unlock_time';
const LAST_BACKGROUND_KEY = 'lifeos_last_background_time';

const DEFAULT_CONFIG: SecurityConfig = {
  enabled: false,
  cooldown: '1min',
  customPinEnabled: false,
  patternEnabled: false,
};

// ── Cooldown Helper ────────────────────────────────────────────────────────
export function getCooldownMilliseconds(cooldown: LockCooldown): number {
  switch (cooldown) {
    case 'immediate':
      return 0;
    case '1min':
      return 60 * 1000;
    case '5min':
      return 5 * 60 * 1000;
    case '15min':
      return 15 * 60 * 1000;
    case 'session':
      return Infinity;
    default:
      return 60 * 1000;
  }
}

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

// ── Background / Foreground Cooldown Handlers ───────────────────────────────
export function recordUnlockTime() {
  if (typeof window === 'undefined') return;
  const now = Date.now().toString();
  localStorage.setItem(LAST_UNLOCK_KEY, now);
  sessionStorage.setItem(LOCK_STATE_KEY, 'false');
}

export function handleAppBackgrounded() {
  if (typeof window === 'undefined') return;
  const now = Date.now().toString();
  localStorage.setItem(LAST_BACKGROUND_KEY, now);
}

export function handleAppForegrounded() {
  if (typeof window === 'undefined') return;
  const config = getSecurityConfig();
  if (!config.enabled) return;

  // Session-only: never lock when returning from background
  if (config.cooldown === 'session') return;

  // Immediate: lock as soon as app is foregrounded
  if (config.cooldown === 'immediate') {
    setAppLocked(true);
    return;
  }

  const lastBgRaw = localStorage.getItem(LAST_BACKGROUND_KEY);
  if (!lastBgRaw) return;

  const lastBg = parseInt(lastBgRaw, 10);
  const elapsed = Date.now() - lastBg;
  const cooldownMs = getCooldownMilliseconds(config.cooldown);

  // If elapsed time is greater than or equal to cooldown, require unlock again
  if (elapsed >= cooldownMs) {
    setAppLocked(true);
  }
}

// ── Authentication Service ─────────────────────────────────────────────────
export async function authenticateDeviceLock(
  subtitle = 'Unlock with your phone’s fingerprint or screen lock'
): Promise<{ success: boolean; error?: string }> {
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

      setAppLocked(false);
      recordUnlockTime();
      return { success: true };
    }

    // 4. Web / Dev environment fallback
    setAppLocked(false);
    recordUnlockTime();
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

// ── PIN Verification Helpers ───────────────────────────────────────────────
export function verifyCustomPin(inputPin: string): boolean {
  const config = getSecurityConfig();
  if (!config.customPinEnabled || !config.customPin) return false;
  return config.customPin === inputPin.trim();
}

export function saveCustomPin(pin: string): SecurityConfig {
  return saveSecurityConfig({
    customPin: pin.trim(),
    customPinEnabled: true,
  });
}

export function removeCustomPin(): SecurityConfig {
  return saveSecurityConfig({
    customPin: '',
    customPinEnabled: false,
  });
}

// ── Lock State Control (Session) ───────────────────────────────────────────
let lockStateListeners: Array<(locked: boolean) => void> = [];

export function isAppLocked(): boolean {
  const config = getSecurityConfig();
  if (!config.enabled) return false;

  const val = sessionStorage.getItem(LOCK_STATE_KEY);
  if (val === 'false') {
    // Check if cooldown elapsed while backgrounded
    if (config.cooldown === 'session') return false;
    const lastBgRaw = localStorage.getItem(LAST_BACKGROUND_KEY);
    if (lastBgRaw) {
      const lastBg = parseInt(lastBgRaw, 10);
      const elapsed = Date.now() - lastBg;
      const cooldownMs = getCooldownMilliseconds(config.cooldown);
      if (elapsed >= cooldownMs && cooldownMs > 0) {
        return true;
      }
    }
    return false;
  }

  // Cold launch: check if last unlock happened recently within cooldown
  if (config.cooldown !== 'immediate') {
    const lastUnlockRaw = localStorage.getItem(LAST_UNLOCK_KEY);
    if (lastUnlockRaw) {
      const lastUnlock = parseInt(lastUnlockRaw, 10);
      const elapsed = Date.now() - lastUnlock;
      const cooldownMs = getCooldownMilliseconds(config.cooldown);
      if (elapsed < cooldownMs) {
        sessionStorage.setItem(LOCK_STATE_KEY, 'false');
        return false;
      }
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
