import { Preferences } from '@capacitor/preferences';
import { argbFromHex, hexFromArgb, Hct } from '@material/material-color-utilities';
import { PALETTES } from './palettes.ts';

export interface ThemeAccent {
  id: string;
  name: string;
  primary: string;   // Hex
  secondary: string; // Hex (light gradient end)
  tertiary?: string; // Hex (bright high-contrast text accent)
  darkText: string;
}

/**
 * Preserve rich, authentic preset hues (so Burgundy stays deep burgundy rather than shifting into pink!)
 * while ensuring --app-accent-text stays cleanly legible against #141416 dark glass surfaces.
 */
function buildLegibleM3Tones(seedHex: string, secondaryHex?: string, tertiaryHex?: string) {
  try {
    const base = Hct.fromInt(argbFromHex(seedHex));
    const sec = secondaryHex ? Hct.fromInt(argbFromHex(secondaryHex)) : base;

    // Preserve authentic hue depth for fills/gradients; only gently lift near-black seeds
    const primaryTone = base.tone < 22
      ? hexFromArgb(Hct.from(base.hue, base.chroma, 28).toInt())
      : seedHex;
    const endTone = sec.tone < 30
      ? hexFromArgb(Hct.from(sec.hue, sec.chroma, 38).toInt())
      : (secondaryHex || primaryTone);

    // If curated high-contrast dark-card text accent exists, keep it exact (prevents red/burgundy -> pink)
    if (tertiaryHex) {
      return { primaryTone, endTone, textTone: tertiaryHex };
    }

    const isCrimsonHue = sec.hue < 32 || sec.hue > 330;
    const minTextTone = isCrimsonHue ? 52 : 66;
    const textTone = hexFromArgb(
      Hct.from(sec.hue, Math.max(36, Math.min(76, sec.chroma)), Math.max(minTextTone, sec.tone)).toInt()
    );

    return { primaryTone, endTone, textTone };
  } catch {
    return {
      primaryTone: seedHex,
      endTone: secondaryHex || seedHex,
      textTone: tertiaryHex || secondaryHex || seedHex,
    };
  }
}

export const PRESET_ACCENTS: ThemeAccent[] = PALETTES.map((p) => {
  const { primaryTone, endTone, textTone } = buildLegibleM3Tones(p.seed, p.secondarySeed, p.tertiarySeed);
  return {
    id: p.id,
    name: p.name,
    primary: primaryTone,
    secondary: endTone,
    tertiary: textTone,
    darkText: primaryTone,
  };
});

export const DEFAULT_ACCENT = PRESET_ACCENTS[0];

export const THEME_ACCENT_STORAGE_KEY = 'lifeos_unified_accent';
export const MIGRATION_VERSION_KEY = 'lifeos_color_migration_v1_done';

export function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 139;
  const g = parseInt(clean.substring(2, 4), 16) || 30;
  const b = parseInt(clean.substring(4, 6), 16) || 63;
  return [r, g, b];
}

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
    const m3Raw = localStorage.getItem('lifeos_m3_theme_config');
    if (m3Raw) {
      const m3Parsed = JSON.parse(m3Raw);
      const found = PRESET_ACCENTS.find((a) => a.id === m3Parsed?.paletteId);
      if (found) activeAccent = found;
    } else {
      const cached = localStorage.getItem(THEME_ACCENT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const found = PRESET_ACCENTS.find((a) => a.id === parsed?.id);
        if (found) activeAccent = found;
      }
    }
  } catch {}
}

export function getActiveAccent(): ThemeAccent {
  return activeAccent;
}

export function setActiveAccent(accent: ThemeAccent): void {
  const resolved = PRESET_ACCENTS.find((a) => a.id === accent.id) || {
    ...accent,
    ...(() => {
      const tones = buildLegibleM3Tones(accent.primary, accent.secondary, accent.tertiary);
      return { primary: tones.primaryTone, secondary: tones.endTone, tertiary: tones.textTone };
    })(),
  };
  activeAccent = resolved;
  try {
    localStorage.setItem(THEME_ACCENT_STORAGE_KEY, JSON.stringify(resolved));
  } catch {}
  Preferences.set({ key: THEME_ACCENT_STORAGE_KEY, value: JSON.stringify(resolved) }).catch(() => {});
  applyUnifiedThemeToDocument(resolved, true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lifeos:theme-accent-changed', { detail: resolved }));
  }
}

/**
 * Apply unified single-color iOS + M3 tokens to documentElement.
 * Guarantees crisp white legibility + subtle light ambient gradients.
 */
export function applyUnifiedThemeToDocument(accent: ThemeAccent = activeAccent, _isDark = true): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const tones = buildLegibleM3Tones(accent.primary, accent.secondary, accent.tertiary);
  const appAccent = tones.primaryTone;
  const appAccentEnd = tones.endTone;
  const appAccentText = tones.textTone;

  const [r, g, b] = hexToRgbTuple(appAccent);
  const [er, eg, eb] = hexToRgbTuple(appAccentEnd);

  // Single unified theme tokens (used everywhere in the app)
  root.style.setProperty('--app-accent', appAccent);
  root.style.setProperty('--app-accent-end', appAccentEnd);
  root.style.setProperty('--app-accent-text', appAccentText);
  root.style.setProperty('--app-accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--app-accent-soft', `rgba(${er}, ${eg}, ${eb}, 0.14)`);
  root.style.setProperty('--app-accent-whisper', `rgba(${er}, ${eg}, ${eb}, 0.06)`);

  root.style.setProperty('--preset-primary', appAccent);
  root.style.setProperty('--preset-secondary', appAccentEnd);
  root.style.setProperty('--preset-tertiary', appAccentText);
  root.style.setProperty('--preset-rgb', `${r}, ${g}, ${b}`);

  root.style.setProperty('--accent', appAccent);
  root.style.setProperty('--accent-2', appAccentEnd);
  root.style.setProperty('--accent-3', appAccentText);
  root.style.setProperty('--accent-dark', appAccentText);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--md-primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-primary', appAccent);
  root.style.setProperty('--accent-secondary', appAccentEnd);

  root.style.setProperty('--accent-text', appAccentText);
  root.style.setProperty('--accent-strong', appAccent);
  root.style.setProperty('--accent-tint', appAccentText);

  root.style.setProperty('--accent-soft', `rgba(${er}, ${eg}, ${eb}, 0.14)`);
  root.style.setProperty('--accent-glow', `rgba(${er}, ${eg}, ${eb}, 0.26)`);
  root.style.setProperty('--pill-active-bg', `rgba(${er}, ${eg}, ${eb}, 0.18)`);
  root.style.setProperty('--pill-active-text', appAccentText);

  // Elegant subtle gradients
  root.style.setProperty('--preset-gradient', `linear-gradient(135deg, ${appAccent} 0%, ${appAccentEnd} 100%)`);
  root.style.setProperty('--glow-rim', `linear-gradient(180deg, transparent 0%, rgba(${er}, ${eg}, ${eb}, 0.36) 70%, rgba(${er}, ${eg}, ${eb}, 0.56) 100%)`);
  root.style.setProperty('--headline-gradient', `linear-gradient(135deg, #FFFFFF 55%, ${appAccentText} 100%)`);
}
