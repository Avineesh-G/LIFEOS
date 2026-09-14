import { registerPlugin, Capacitor } from '@capacitor/core';

export interface SecurityConfig {
  enabled: boolean;
}

interface DeviceLockPlugin {
  isAvailable(): Promise<{ available: boolean; isDeviceSecure?: boolean; hasBiometrics?: boolean; status?: number; error?: string }>;
  authenticate(options?: { title?: string; subtitle?: string }): Promise<{ success: boolean; errorCode?: number; message?: string; error?: string }>;
}

export const DeviceLock = registerPlugin<DeviceLockPlugin>('DeviceLock');

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

export async function authenticateDeviceLock(subtitle = 'Unlock with your phone’s fingerprint or screen lock'): Promise<{ success: boolean; error?: string }> {
  // 1. Android Native Execution
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await DeviceLock.authenticate({
        title: 'LifeOS Protected',
        subtitle,
      });
      if (res && res.success) {
        setAppLocked(false);
        return { success: true };
      } else {
        const errMsg = res?.error || res?.message || 'Authentication canceled';
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication error' };
    }
  }

  // 2. Browser / Localhost Dev Fallback
  setAppLocked(false);
  return { success: true };
}

export async function isDeviceLockAvailable(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await DeviceLock.isAvailable();
      return !!res?.available;
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
  lockStateListeners.forEach(listener => listener(locked));
}

export function subscribeToLockState(listener: (locked: boolean) => void): () => void {
  lockStateListeners.push(listener);
  return () => {
    lockStateListeners = lockStateListeners.filter(l => l !== listener);
  };
}
