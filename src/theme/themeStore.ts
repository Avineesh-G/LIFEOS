/**
 * Material 3 Expressive Theme Store & Application Engine
 * Manages theme state, persistence, CSS variable writing, and system sync.
 */

import { DEFAULT_PALETTE_ID, DEFAULT_THEME_MODE, getPaletteById } from './palettes';
import { getSchemeForPalette, schemeToCssVariables, M3ColorScheme } from './colorEngine';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  paletteId: string;
  mode: ThemeMode;
}

const THEME_STORAGE_KEY = 'lifeos_m3_theme_config';
const LEGACY_STORAGE_KEYS = [
  'lifeos_interface_colors',
  'lifeos_app_accent_color',
  'lifeos_theme_mode',
  'lifeos_custom_colors',
];

type Listener = (config: ThemeConfig, scheme: M3ColorScheme, isDark: boolean) => void;
const listeners = new Set<Listener>();

let currentConfig: ThemeConfig = loadSavedTheme();

/**
 * Clean up legacy per-interface color storage keys
 */
function purgeLegacyKeys() {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Loads saved theme config or default
 */
export function loadSavedTheme(): ThemeConfig {
  purgeLegacyKeys();
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.paletteId && parsed.mode) {
        return {
          paletteId: parsed.paletteId,
          mode: parsed.mode,
        };
      }
    }
  } catch {}
  return {
    paletteId: DEFAULT_PALETTE_ID,
    mode: DEFAULT_THEME_MODE,
  };
}

/**
 * Checks whether dark mode is currently active
 */
export function isDarkModeActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

/**
 * Writes CSS variables to documentElement
 */
export function applyThemeToDom(config: ThemeConfig): { scheme: M3ColorScheme; isDark: boolean } {
  const isDark = isDarkModeActive(config.mode);
  const scheme = getSchemeForPalette(config.paletteId, isDark);
  const vars = schemeToCssVariables(scheme);

  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    // Toggle .dark class on html
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Write CSS variables
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }

    // Set dataset
    root.setAttribute('data-palette', config.paletteId);
    root.setAttribute('data-theme-mode', config.mode);

    // Update <meta name="theme-color">
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', scheme.surface);
  }

  return { scheme, isDark };
}

/**
 * Gets the active theme configuration
 */
export function getActiveTheme(): ThemeConfig {
  return { ...currentConfig };
}

/**
 * Saves and applies a new theme configuration across the app
 */
export function saveAndApplyTheme(config: ThemeConfig): void {
  currentConfig = { ...config };
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(currentConfig));
  } catch {}

  const { scheme, isDark } = applyThemeToDom(currentConfig);

  // Notify listeners
  for (const listener of listeners) {
    try {
      listener(currentConfig, scheme, isDark);
    } catch (err) {
      console.error('Error in theme listener:', err);
    }
  }
}

/**
 * Resets theme to Burgundy default
 */
export function resetThemeToDefault(): void {
  saveAndApplyTheme({
    paletteId: DEFAULT_PALETTE_ID,
    mode: DEFAULT_THEME_MODE,
  });
}

/**
 * Subscribes to theme changes
 */
export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Listen to system dark mode changes if mode is 'system'
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentConfig.mode === 'system') {
      applyThemeToDom(currentConfig);
    }
  });
}
