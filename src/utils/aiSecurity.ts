import { Preferences } from '@capacitor/preferences';
import { GROQ_CONFIG } from '../config/ai.ts';
import type { NoteItem } from '../types.ts';

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
  laundry?: boolean;
  history?: boolean;
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
  laundry: true,
  history: true,
  vault: false,
};

// In-memory cache for ultra-fast access
let cachedApiKey = '';
let cachedProxyUrl = '';
let cachedReadData = true;
let cachedPermissions = { ...DEFAULT_SECTION_PERMISSIONS };
let cachedAllowChanges = true;
let cachedConsentAgreed = false;
let cachedTrackUsage = true;

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
    cachedAllowChanges = changesPref !== null ? changesPref === 'true' : true;

    const consentPref = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.CONSENT_AGREED);
    cachedConsentAgreed = consentPref === 'true';

    const usagePref = localStorage.getItem('lifeos_ai_track_usage');
    cachedTrackUsage = usagePref !== null ? usagePref === 'true' : true;
  } catch (err) {
    console.warn('Failed to load AI Security preferences:', err);
  }
}

export function getGroqApiKey(): string {
  if (cachedApiKey) return cachedApiKey;
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY);
    if (val) {
      cachedApiKey = val;
      return val;
    }
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GROQ_API_KEY) {
    return (import.meta as any).env.VITE_GROQ_API_KEY;
  }
  return '';
}

export async function setGroqApiKey(key: string, updateDataFn?: (patch: any) => Promise<any>): Promise<void> {
  cachedApiKey = key.trim();
  try {
    await Preferences.set({ key: GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY, value: cachedApiKey });
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.GROQ_API_KEY, cachedApiKey);
    if (updateDataFn) {
      await updateDataFn({ geminiApiKey: cachedApiKey });
    }
  } catch {}
}

export function getAiProxyUrl(): string {
  if (cachedProxyUrl) return cachedProxyUrl;
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.PROXY_URL);
    if (val) {
      cachedProxyUrl = val;
      return val;
    }
  }
  return '';
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
  if (typeof localStorage !== 'undefined') {
    const pref = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.ACTION_ALLOW_CHANGES);
    if (pref !== null) return pref === 'true';
  }
  return true;
}

export function setLetAiMakeChanges(val: boolean): void {
  cachedAllowChanges = val;
  try {
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.ACTION_ALLOW_CHANGES, String(val));
  } catch {}
}

export function getHasAgreedConsent(): boolean {
  if (cachedConsentAgreed) return true;
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(GROQ_CONFIG.STORAGE_KEYS.CONSENT_AGREED);
    if (val === 'true') {
      cachedConsentAgreed = true;
      return true;
    }
  }
  return false;
}

export function setHasAgreedConsent(val: boolean): void {
  cachedConsentAgreed = val;
  try {
    localStorage.setItem(GROQ_CONFIG.STORAGE_KEYS.CONSENT_AGREED, String(val));
  } catch {}
}

export function getTrackAppUsage(): boolean {
  return cachedTrackUsage;
}

export function setTrackAppUsage(val: boolean): void {
  cachedTrackUsage = val;
  try {
    localStorage.setItem('lifeos_ai_track_usage', String(val));
  } catch {}
}

/**
 * Checks whether a specific note item is excluded from AI context.
 * Notes that are archived, locked, or explicitly flagged hideFromAi: true MUST be excluded.
 */
export function isNoteExcludedFromAi(note: NoteItem): boolean {
  if (!note) return true;
  if (note.isArchived) return true;
  if (note.hideFromAi) return true;
  if (note.isLocked) return true;
  return false;
}

/**
 * Redaction layer that strips API keys, passwords, PINs, OTPs, credit cards, bank accounts,
 * and government IDs from any text leaving the device to Groq.
 */
export function redactSensitiveInformation(text: string): string {
  if (!text) return '';

  let redacted = text;

  // 1. API Keys (Groq gsk_..., OpenAI sk-..., Google AIza..., Bearer tokens, eyJ...)
  redacted = redacted.replace(/\b(gsk_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|AIza[0-9A-Za-z-_]{35}|eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b/gi, '[REDACTED_API_KEY]');

  // 2. Passwords / Secrets in text (e.g. password: xyz, pwd = 12345, secret: abc)
  redacted = redacted.replace(/\b(password|passwd|pwd|passcode|masterpin|master_pin|secret)\s*[:=]\s*[^\s,;]+/gi, '$1: [REDACTED_SECRET]');

  // 3. OTP codes & PINs (e.g. OTP: 123456, PIN: 4321, code: 987654)
  redacted = redacted.replace(/\b(otp|pin|verification code|security code)\s*[:=]\s*\d{4,8}\b/gi, '$1: [REDACTED_CODE]');

  // 4. Credit / Debit card numbers (13-19 digits, space/dash separated)
  redacted = redacted.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    const raw = match.replace(/[\s-]/g, '');
    if (raw.length >= 13 && raw.length <= 19 && /^\d+$/.test(raw)) {
      return '[REDACTED_CARD_NUMBER]';
    }
    return match;
  });

  // 5. Government IDs (Aadhaar 12-digit, PAN 10-char, SSN 9-digit)
  redacted = redacted.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_GOVT_ID]');
  redacted = redacted.replace(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi, '[REDACTED_PAN_ID]');
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

  // 6. Bank Account Numbers (9-18 digits labelled account/acct/bank)
  redacted = redacted.replace(/\b(account|acct|bank|a\/c)\s*#?\s*[:=]?\s*\d{9,18}\b/gi, '$1: [REDACTED_ACCOUNT_NO]');

  return redacted;
}
