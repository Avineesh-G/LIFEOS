import { Preferences } from '@capacitor/preferences';

export interface ThemeAccent {
  id: string;
  name: string;
  primary: string;   // Hex
  secondary: string; // Hex
  darkText: string;  // Dark saturated variant for Light Mode AA contrast
}

export const PRESET_ACCENTS: ThemeAccent[] = [
  { id: 'classic-burgundy', name: 'Classic Burgundy', primary: '#800020', secondary: '#A31D45', darkText: '#5A0015' },
  { id: 'midnight-burgundy', name: 'Midnight Burgundy', primary: '#35000C', secondary: '#5A0015', darkText: '#200007' },
  { id: 'deep-burgundy', name: 'Deep Burgundy', primary: '#4A0012', secondary: '#6D001E', darkText: '#30000B' },
  { id: 'dark-burgundy', name: 'Dark Burgundy', primary: '#5C0018', secondary: '#800020', darkText: '#3D0010' },
  { id: 'maroon-burgundy', name: 'Maroon Burgundy', primary: '#6D001E', secondary: '#8E0528', darkText: '#4A0014' },
  { id: 'rich-burgundy', name: 'Rich Burgundy', primary: '#8B1E3F', secondary: '#AB2850', darkText: '#5E1029' },
  { id: 'royal-burgundy', name: 'Royal Burgundy', primary: '#92243F', secondary: '#B23051', darkText: '#641329' },
  { id: 'warm-burgundy', name: 'Warm Burgundy', primary: '#9E3048', secondary: '#BF3D59', darkText: '#6F1B2D' },
  { id: 'soft-burgundy', name: 'Soft Burgundy', primary: '#A83D55', secondary: '#C74F69', darkText: '#762438' },
  { id: 'rose-burgundy', name: 'Rose Burgundy', primary: '#B66A7A', secondary: '#D17F90', darkText: '#823D4D' },
];

export const DEFAULT_ACCENT = PRESET_ACCENTS[0]; // Classic Burgundy #800020


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
export function applyUnifiedThemeToDocument(accent: ThemeAccent = activeAccent, isDark = false): void {
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
