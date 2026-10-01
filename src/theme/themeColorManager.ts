import { Preferences } from '@capacitor/preferences';

export interface ThemeAccent {
  id: string;
  name: string;
  primary: string;   // Hex
  secondary: string; // Hex
  darkText: string;  // Dark saturated variant for Light Mode AA contrast
}

export const PRESET_ACCENTS: ThemeAccent[] = [
  { id: 'teal', name: 'Gemini Teal', primary: '#2DD4BF', secondary: '#22D3EE', darkText: '#0F766E' },
  { id: 'cyan', name: 'Electric Cyan', primary: '#06B6D4', secondary: '#38BDF8', darkText: '#0E7490' },
  { id: 'emerald', name: 'Jade Emerald', primary: '#10B981', secondary: '#34D399', darkText: '#047857' },
  { id: 'sky', name: 'Celestial Sky', primary: '#38BDF8', secondary: '#818CF8', darkText: '#0284C7' },
  { id: 'mint', name: 'Polar Mint', primary: '#5EEAD4', secondary: '#7DD3FC', darkText: '#0D9488' },
  { id: 'azure', name: 'Deep Azure', primary: '#3B82F6', secondary: '#60A5FA', darkText: '#1D4ED8' },
];

export const DEFAULT_ACCENT = PRESET_ACCENTS[0]; // Gemini Teal #2DD4BF

export const THEME_ACCENT_STORAGE_KEY = 'lifeos_unified_accent';
export const MIGRATION_VERSION_KEY = 'lifeos_color_migration_v1_done';

export function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 45;
  const g = parseInt(clean.substring(2, 4), 16) || 212;
  const b = parseInt(clean.substring(4, 6), 16) || 191;
  return [r, g, b];
}

/**
 * Migration engine: purges legacy per-interface color storage keys ONCE on startup.
 * Guarded by MIGRATION_VERSION_KEY.
 */
export function migrateLegacyThemeStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const isMigrated = localStorage.getItem(MIGRATION_VERSION_KEY);
    if (!isMigrated) {
      localStorage.removeItem('lifeos_interface_colors');
      localStorage.removeItem('interfaceColors');
      localStorage.removeItem('accentColor');
      localStorage.removeItem('settings.interfaceColors');
      localStorage.setItem(MIGRATION_VERSION_KEY, 'true');
    }
  } catch {}
}

let activeAccent: ThemeAccent = DEFAULT_ACCENT;

if (typeof window !== 'undefined') {
  migrateLegacyThemeStorage();
  try {
    const cached = localStorage.getItem(THEME_ACCENT_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.primary) {
        activeAccent = parsed;
      }
    }
  } catch {}
}

export function getActiveAccent(): ThemeAccent {
  return activeAccent;
}

export function setActiveAccent(accent: ThemeAccent): void {
  activeAccent = accent;
  try {
    localStorage.setItem(THEME_ACCENT_STORAGE_KEY, JSON.stringify(accent));
  } catch {}
  Preferences.set({ key: THEME_ACCENT_STORAGE_KEY, value: JSON.stringify(accent) }).catch(() => {});
  applyUnifiedThemeToDocument(accent);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lifeos:theme-accent-changed', { detail: accent }));
  }
}

/**
 * Apply dynamic single source of truth tokens to document.documentElement
 */
export function applyUnifiedThemeToDocument(accent: ThemeAccent = activeAccent, isDark = true): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const [r, g, b] = hexToRgbTuple(accent.primary);

  // Core Accent tokens
  root.style.setProperty('--accent', accent.primary);
  root.style.setProperty('--accent-2', accent.secondary);
  root.style.setProperty('--accent-dark', accent.darkText);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--md-primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-primary', accent.primary);
  root.style.setProperty('--accent-secondary', accent.secondary);

  // Text accent color (Dark mode uses vibrant primary; Light mode uses dark saturated variant for WCAG AA)
  const textAccentColor = isDark ? accent.primary : accent.darkText;
  root.style.setProperty('--accent-text', textAccentColor);
  root.style.setProperty('--accent-strong', isDark ? accent.primary : accent.darkText);
  root.style.setProperty('--accent-tint', textAccentColor);

  // Soft surface & container opacities
  root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--pill-active-bg', `rgba(${r}, ${g}, ${b}, 0.18)`);
  root.style.setProperty('--pill-active-text', textAccentColor);

  // Glass rims & gradients derived directly from accent
  root.style.setProperty('--glow-rim', isDark
    ? `linear-gradient(180deg, transparent 0%, ${accent.primary} 60%, ${accent.secondary} 100%)`
    : `linear-gradient(180deg, transparent 0%, rgba(${r}, ${g}, ${b}, 0.6) 60%, rgba(${r}, ${g}, ${b}, 0.8) 100%)`
  );

  // Headline gradient
  root.style.setProperty('--headline-gradient', `linear-gradient(to right, ${isDark ? '#F2F3F5' : '#1E2024'}, ${accent.primary})`);
}
