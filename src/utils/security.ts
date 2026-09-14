import { registerPlugin, Capacitor, WebPlugin } from '@capacitor/core';

export interface SecurityConfig {
  enabled: boolean;
}

interface DeviceLockPlugin {
  isAvailable(): Promise<{ available: boolean; isDeviceSecure?: boolean; hasBiometrics?: boolean; status?: number; error?: string }>;
  authenticate(options?: { title?: string; subtitle?: string }): Promise<{ success: boolean; errorCode?: number; message?: string; error?: string }>;
}

class DeviceLockWeb extends WebPlugin implements DeviceLockPlugin {
  async isAvailable(): Promise<{ available: boolean; isDeviceSecure?: boolean; hasBiometrics?: boolean; status?: number; error?: string }> {
    if (Capacitor.isNativePlatform()) {
      return {
        available: false,
        error: 'Native phone screen lock requires the latest LifeOS APK (v1.5.4). Please reinstall or update the app from Settings.',
      };
    }
    return { available: true, isDeviceSecure: true, hasBiometrics: false };
  }

  async authenticate(options?: { title?: string; subtitle?: string }): Promise<{ success: boolean; errorCode?: number; message?: string; error?: string }> {
    if (Capacitor.isNativePlatform()) {
      return {
        success: false,
        error: 'Native phone screen lock requires the latest LifeOS APK (v1.5.4). Please reinstall or update the app from Settings.',
      };
    }
    return { success: true };
  }
}

export const DeviceLock = registerPlugin<DeviceLockPlugin>('DeviceLock', {
  web: () => new DeviceLockWeb(),
});

const STORAGE_KEY = 'lifeos_app_security_v2';
const LOCK_STATE_KEY = 'lifeos_is_locked_session';

const DEFAULT_CONFIG: SecurityConfig = {
  enabled: false,
};

// ── Configuration Persistence ──────────────────────────────────────────────
export function getSecurityConfig(): SecurityConfig {
  return DEFAULT_CONFIG;
}

export function saveSecurityConfig(config: Partial<SecurityConfig>): SecurityConfig {
  return DEFAULT_CONFIG;
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
