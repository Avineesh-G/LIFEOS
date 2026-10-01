import { Preferences } from '@capacitor/preferences';
import { GROQ_CONFIG } from '../config/ai';

export interface AiSectionPermissions {
  gym: boolean;
  nutrition: boolean;
  study: boolean;
  todo: boolean;
  spending: boolean;
  notes: boolean;
  timetable: boolean;
  outings: boolean;
  shopping: boolean;
  readonly vault: false; // Always excluded, strictly immutable
}

export const DEFAULT_SECTION_PERMISSIONS: AiSectionPermissions = {
  gym: true,
  nutrition: true,
  study: true,
  todo: true,
  spending: true,
  notes: true,
  timetable: true,
  outings: true,
  shopping: true,
  vault: false,
};

// In-memory cache for ultra-fast access
let cachedApiKey = '';
let cachedProxyUrl = '';
let cachedReadData = true;
let cachedPermissions = { ...DEFAULT_SECTION_PERMISSIONS };
let cachedAllowChanges = false;
let cachedConsentAgreed = false;

/**
 * Initialize AI Security settings from Capacitor Preferences & LocalStorage
 */
export async function initAiSecurity(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // API Key from secure Preferences
    const keyPref = await Preferences.get({ key: GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY });
    cachedApiKey = keyPref.value || localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY) || '';

    // Proxy URL
    const proxyPref = await Preferences.get({ key: GROQ_CONFIG.STORAGE_KEYS.PROXY_URL });
    cachedProxyUrl = proxyPref.value || localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.PROXY_URL) || '';

    // Privacy toggles
    const readPref = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.PRIVACY_READ_DATA);
    cachedReadData = readPref !== null ? readPref === 'true' : true;

    const sectionsPref = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.PRIVACY_SECTIONS);
    if (sectionsPref) {
      const parsed = JSON.parse(sectionsPref);
      cachedPermissions = {
        ...DEFAULT_SECTION_PERMISSIONS,
        ...parsed,
        vault: false, // Enforce Vault exclusion
      };
    }

    const changesPref = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.ACTION_ALLOW_CHANGES);
    cachedAllowChanges = changesPref === 'true';

    const consentPref = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.CONSENT_AGREED);
    cachedConsentAgreed = consentPref === 'true';
  } catch (err) {
    console.warn('Failed to load AI Security preferences:', err);
  }
}

export function getGroqApiKey(): string {
  return cachedApiKey;
}

export async function setGroqApiKey(key: string): Promise<void> {
  cachedApiKey = key.trim();
  try {
    await Preferences.set({ key: GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY, value: cachedApiKey });
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY, cachedApiKey);
  } catch {}
}

export function getAiProxyUrl(): string {
  return cachedProxyUrl;
}

export async function setAiProxyUrl(url: string): Promise<void> {
  cachedProxyUrl = url.trim();
  try {
    await Preferences.set({ key: GROQ_CONFIG.STORAGE_KEYS.PROXY_URL, value: cachedProxyUrl });
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.PROXY_URL, cachedProxyUrl);
  } catch {}
}

export function getLetAiReadData(): boolean {
  return cachedReadData;
}

export function setLetAiReadData(val: boolean): void {
  cachedReadData = val;
  try {
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.PRIVACY_READ_DATA, String(val));
  } catch {}
}

export function getSectionPermissions(): AiSectionPermissions {
  return { ...cachedPermissions, vault: false };
}

export function setSectionPermission(section: keyof AiSectionPermissions, val: boolean): void {
  if (section === 'vault') return; // Cannot enable Vault
  cachedPermissions[section] = val;
  cachedPermissions.vault = false;
  try {
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.PRIVACY_SECTIONS, JSON.stringify(cachedPermissions));
  } catch {}
}

export function getLetAiMakeChanges(): boolean {
  return cachedAllowChanges;
}

export function setLetAiMakeChanges(val: boolean): void {
  cachedAllowChanges = val;
  try {
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.ACTION_ALLOW_CHANGES, String(val));
  } catch {}
}

export function getHasAgreedConsent(): boolean {
  return cachedConsentAgreed;
}

export function setHasAgreedConsent(val: boolean): void {
  cachedConsentAgreed = val;
  try {
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CONSENT_AGREED, String(val));
  } catch {}
}
