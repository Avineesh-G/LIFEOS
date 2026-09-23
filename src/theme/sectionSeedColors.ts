/**
 * LifeOS — Material 3 Expressive Section Seed Colors
 * 
 * Powered by Google's @material/material-color-utilities.
 * Color is keyed strictly by app section (fixed per section, route-derived),
 * completely replacing day-phase color dependencies.
 */

import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from '@material/material-color-utilities';

import { PALETTE } from './palette.ts';
import {
  getPersistedInterfaceColors,
  getCustomizableInterfaceFromPathname,
  getInterfaceColorFamily,
  getRawUserCustomColors,
} from './interfaceColorManager.ts';
import type { CustomizableInterfaceId } from './interfaceColorManager.ts';
import type { ColorFamily } from './colorFamilies.ts';
import { getReadableForeground, COLOR_FAMILIES, DEFAULT_INTERFACE_COLORS } from './colorFamilies.ts';

export type AppSection = 'home' | 'finance' | 'gym' | 'nutrition' | 'study' | 'settings' | 'history' | 'outing' | 'shopping' | 'vault' | 'notes';

/**
 * Fixed identity seed color per section from PALETTE
 */
export const SECTION_SEED_COLORS: Record<AppSection, string> = {
  home: PALETTE.home.seed,          // Royal Blue #2563EB
  finance: PALETTE.finance.seed,    // Forest Green #15803D
  gym: PALETTE.gym.seed,            // Coral Crimson #E11D48
  nutrition: PALETTE.nutrition.seed,// Solar Amber #F5A623
  study: PALETTE.study.seed,        // Lagoon Cyan #0891B2
  settings: PALETTE.settings.seed,  // Slate #475569
  history: PALETTE.history.seed,    // History Burgundy #8C1D40
  outing: PALETTE.outing.seed,      // Saddle Brown #8C500A
  shopping: '#172554',              // Deep Midnight Navy #172554
  vault: '#2034A0',                 // Cyber Cobalt #2034A0
  notes: '#C026D3',                 // Radiant Electric Orchid Fuchsia #C026D3
};

/**
 * Resolves the active personalized color family for a given route or interface
 */
export function getRoutePersonalizedColorFamily(
  pathnameOrInterface: string,
  customAssignments?: Record<string, string>
): ColorFamily | null {
  const interfaceId = pathnameOrInterface.startsWith('/')
    ? getCustomizableInterfaceFromPathname(pathnameOrInterface)
    : (pathnameOrInterface as CustomizableInterfaceId);

  if (!interfaceId) return null;

  const custom = getRawUserCustomColors(customAssignments);
  if (!custom) return null;

  const colorId = custom[interfaceId];
  if (!colorId || !COLOR_FAMILIES[colorId]) return null;

  // If assigned color matches the default family for this interface, return null to preserve authentic PALETTE!
  if (colorId === DEFAULT_INTERFACE_COLORS[interfaceId]) {
    return null;
  }

  return COLOR_FAMILIES[colorId];
}

/**
 * Pale tonal container colors for Navigation Bar Pill
 * - Light mode: soft, desaturated tone closer to canvas #FDFDFD
 * - Dark mode: soft, desaturated tone closer to dark canvas #121316
 */
export const NAV_PILL_BG_COLORS: Record<AppSection, { light: string; dark: string }> = {
  home: { light: '#E0E9FC', dark: '#162545' },       // pale tonal container from #2563EB
  gym: { light: '#FBDFE5', dark: '#381620' },        // pale tonal container from #E11D48
  nutrition: { light: '#FEF3E0', dark: '#3A2A14' },  // pale tonal container from #F5A623
  finance: { light: '#E8F5E9', dark: '#122E1A' },    // pale tonal container from #15803D
  study: { light: '#E0F7FA', dark: '#0C2A33' },      // pale tonal container from #0891B2
  settings: { light: '#EEF2F6', dark: '#1E2530' },   // pale tonal container from #475569
  history: { light: '#FCE8EE', dark: '#2E131B' },    // pale tonal container from #8C1D40
  outing: { light: '#FDF7F2', dark: '#2A1806' },     // pale tonal container from #8C500A
  shopping: { light: '#EFF6FF', dark: '#0F172A' },   // pale tonal container from #172554
  vault: { light: '#EEF2FF', dark: '#0C122B' },      // pale tonal container from #2034A0
  notes: { light: '#FDF4FF', dark: '#280E2B' },      // pale tonal container from #C026D3
};

export function getNavPillBg(
  section: AppSection,
  isDark: boolean,
  pathnameOrColorFamily?: string | ColorFamily | null
): string {
  if (pathnameOrColorFamily) {
    const family =
      typeof pathnameOrColorFamily === 'string'
        ? getRoutePersonalizedColorFamily(pathnameOrColorFamily)
        : pathnameOrColorFamily;
    if (family) {
      return isDark ? family.dark.surfaceSoft : family.surfaceSoft;
    }
  }
  const tones = NAV_PILL_BG_COLORS[section] || NAV_PILL_BG_COLORS.home;
  return isDark ? tones.dark : tones.light;
}

export function getNavSquircleBg(
  section: AppSection,
  isDark: boolean,
  pathnameOrColorFamily?: string | ColorFamily | null
): string {
  if (pathnameOrColorFamily) {
    const family =
      typeof pathnameOrColorFamily === 'string'
        ? getRoutePersonalizedColorFamily(pathnameOrColorFamily)
        : pathnameOrColorFamily;
    if (family) {
      return isDark ? family.dark.primary : family.primary;
    }
  }
  if (section === 'shopping') return isDark ? '#254BB5' : '#172554';
  if (section === 'vault') return isDark ? '#3B82F6' : '#2034A0';
  const paletteEntry = PALETTE[section] || PALETTE.home;
  return isDark ? paletteEntry.darkStrong : paletteEntry.seed;
}


/**
 * Maps any pathname in LifeOS to its canonical AppSection
 */
export function getSectionFromPathname(pathname: string): AppSection {
  const p = (pathname || '/').toLowerCase();
  if (p.startsWith('/gym/history')) {
    return 'gym';
  }
  if (p.startsWith('/shopping')) {
    return 'shopping';
  }
  if (p.startsWith('/spending')) {
    return 'finance';
  }
  if (p.startsWith('/gym')) {
    return 'gym';
  }
  if (p.startsWith('/nutrition')) {
    return 'nutrition';
  }
  if (p.startsWith('/study') || p.startsWith('/timetable')) {
    return 'study';
  }
  if (p.startsWith('/vault')) {
    return 'vault';
  }
  if (p.startsWith('/settings')) {
    return 'settings';
  }
  if (p.startsWith('/history')) {
    return 'history';
  }
  if (p.startsWith('/outings')) {
    return 'outing';
  }
  if (p.startsWith('/notes')) {
    return 'notes';
  }
  return 'home'; // '/', '/tasks', '/laundry'
}

export interface M3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  shadow: string;
  scrim: string;
  sceneBg: string;
  onSceneBg: string;
  accentBlob: string;
  blobPosition: BlobPosition;
}

export type BlobPosition = 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'top-center';

export const SECTION_BLOB_POSITIONS: Record<AppSection, BlobPosition> = {
  home: 'top-right',
  gym: 'bottom-left',
  finance: 'top-left',
  nutrition: 'bottom-right',
  study: 'top-right',
  settings: 'bottom-left',
  history: 'bottom-right',
  outing: 'top-right',
  shopping: 'top-left',
  vault: 'top-center',
  notes: 'top-right',
};

export interface SectionM3Theme {
  section: AppSection;
  seedHex: string;
  isDark: boolean;
  scheme: M3ColorScheme;
}

/**
 * Converts a 6-digit hex color to an [R, G, B] tuple.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

/**
 * Blends a base hex color with a tint hex color at a given ratio (0..1).
 * Used for Part A: ~5% seed tint into #FDFDFD (light) or #121316 (dark).
 */
export function blendHex(baseHex: string, tintHex: string, ratio: number = 0.05): string {
  const [r1, g1, b1] = hexToRgb(baseHex);
  const [r2, g2, b2] = hexToRgb(tintHex);
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const themeCache = new Map<string, SectionM3Theme>();

/**
 * Generate the complete Material 3 Expressive role set for a section.
 * - Part A: Base canvas #FDFDFD (light) / #121316 (dark) tinted ~5% toward seedHex
 * - Card surfaces: light-mode cards ~96-98% tone, dark-mode cards ~14-18% tone derived from seed
 * - Blob: filled with seedHex at ~14% (light) / ~20% (dark)
 */
export function getM3ThemeForSection(
  section: AppSection,
  isDark: boolean,
  colorFamilyOverride?: ColorFamily
): SectionM3Theme {
  const cacheKey = `${section}:${isDark ? 'dark' : 'light'}:${colorFamilyOverride ? colorFamilyOverride.id : 'default'}`;
  const cached = themeCache.get(cacheKey);
  if (cached) return cached;

  const seedHex = colorFamilyOverride
    ? (isDark ? colorFamilyOverride.dark.primary : colorFamilyOverride.primary)
    : (SECTION_SEED_COLORS[section] || SECTION_SEED_COLORS.home);
  const sourceArgb = argbFromHex(seedHex);
  const theme = themeFromSourceColor(sourceArgb);

  const rawScheme = isDark ? theme.schemes.dark : theme.schemes.light;
  const neutral = theme.palettes.neutral;

  // 1. Base canvas: #FDFDFD in light mode, #121316 in dark mode, tinted ~5% toward seedHex
  const baseLight = '#FDFDFD';
  const baseDark = '#121316';
  const sceneBg = isDark ? blendHex(baseDark, seedHex, 0.05) : blendHex(baseLight, seedHex, 0.05);
  // Pixel 4-level tonal hierarchy: Primary #F2F3F5 (dark) / #1E2024 (light)
  const onSceneBg = isDark ? '#F2F3F5' : '#1E2024';

  // 2. Accent blob uses seed color directly
  const accentBlob = seedHex;
  const blobPosition = SECTION_BLOB_POSITIONS[section] || 'top-right';

  // 3. Card surfaces sit on top, using tone steps generated from the same seed
  // Light-mode cards ≈ seed hue at ~96–98% tone (nearly white, faintly warm/cool)
  // Dark-mode cards ≈ seed hue at ~14–18% tone (nearly #121316, faintly tinted)
  let surfaceContainerLowest: string;
  let surfaceContainerLow: string;
  let surfaceContainer: string;
  let surfaceContainerHigh: string;
  let surfaceContainerHighest: string;
  let surface: string;
  let onSurface = isDark ? '#F2F3F5' : '#1E2024';

  if (isDark) {
    surface = hexFromArgb(neutral.tone(14));
    surfaceContainerLowest = hexFromArgb(neutral.tone(10));
    surfaceContainerLow = hexFromArgb(neutral.tone(14));
    surfaceContainer = hexFromArgb(neutral.tone(16));
    surfaceContainerHigh = hexFromArgb(neutral.tone(18));
    surfaceContainerHighest = hexFromArgb(neutral.tone(20));
  } else {
    surface = hexFromArgb(neutral.tone(98));
    surfaceContainerLowest = '#FFFFFF';
    surfaceContainerLow = hexFromArgb(neutral.tone(97));
    surfaceContainer = hexFromArgb(neutral.tone(96));
    surfaceContainerHigh = hexFromArgb(neutral.tone(94));
    surfaceContainerHighest = hexFromArgb(neutral.tone(92));
  }

  const surfaceDim = hexFromArgb(isDark ? neutral.tone(10) : neutral.tone(87));
  const surfaceBright = hexFromArgb(isDark ? neutral.tone(22) : neutral.tone(98));

  const scheme: M3ColorScheme = {
    primary: hexFromArgb(rawScheme.primary),
    onPrimary: hexFromArgb(rawScheme.onPrimary),
    primaryContainer: hexFromArgb(rawScheme.primaryContainer),
    onPrimaryContainer: hexFromArgb(rawScheme.onPrimaryContainer),
    secondary: hexFromArgb(rawScheme.secondary),
    onSecondary: hexFromArgb(rawScheme.onSecondary),
    secondaryContainer: hexFromArgb(rawScheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(rawScheme.onSecondaryContainer),
    tertiary: hexFromArgb(rawScheme.tertiary),
    onTertiary: hexFromArgb(rawScheme.onTertiary),
    tertiaryContainer: hexFromArgb(rawScheme.tertiaryContainer),
    onTertiaryContainer: hexFromArgb(rawScheme.onTertiaryContainer),
    error: hexFromArgb(rawScheme.error),
    onError: hexFromArgb(rawScheme.onError),
    errorContainer: hexFromArgb(rawScheme.errorContainer),
    onErrorContainer: hexFromArgb(rawScheme.onErrorContainer),
    surface,
    onSurface,
    surfaceVariant: hexFromArgb(rawScheme.surfaceVariant),
    // Pixel 4-level tonal hierarchy: Secondary #B8BBC3 (dark) / #575B66 (light)
    onSurfaceVariant: isDark ? '#B8BBC3' : '#575B66',
    surfaceDim,
    surfaceBright,
    surfaceContainerLowest,
    surfaceContainerLow,
    surfaceContainer,
    surfaceContainerHigh,
    surfaceContainerHighest,
    // Pixel 4-level tonal hierarchy: Tertiary #858994 (dark) / #808593 (light)
    outline: isDark ? '#858994' : '#808593',
    outlineVariant: hexFromArgb(rawScheme.outlineVariant),
    inverseSurface: hexFromArgb(rawScheme.inverseSurface),
    inverseOnSurface: hexFromArgb(rawScheme.inverseOnSurface),
    inversePrimary: hexFromArgb(rawScheme.inversePrimary),
    shadow: 'transparent',
    scrim: hexFromArgb(rawScheme.scrim),
    sceneBg,
    onSceneBg,
    accentBlob,
    blobPosition,
  };

  if (section === 'history') {
    scheme.primary = isDark ? '#AA3B58' : '#8C1D40';
    scheme.onPrimary = '#FFFFFF';
    scheme.primaryContainer = isDark ? '#5C1028' : '#FFD9DF';
    scheme.onPrimaryContainer = isDark ? '#FFD9DF' : '#3B0014';
    scheme.secondary = isDark ? '#D66FA0' : '#8C1D40';
  }

  if (section === 'study') {
    scheme.primary = '#0891B2';
    scheme.onPrimary = '#1A1A1F';
    scheme.secondary = isDark ? '#80D2ED' : '#0E7D9A';
  }

  if (section === 'nutrition') {
    scheme.onPrimary = '#1A1A1F';
    scheme.secondary = isDark ? '#FBC15E' : '#9F6803';
  }

  if (section === 'finance') {
    scheme.primary = '#15803D';
    scheme.secondary = isDark ? '#82CB92' : '#15803D';
  }

  if (section === 'settings') {
    scheme.primary = isDark ? '#556378' : '#475569';
    scheme.secondary = isDark ? '#A7AEBB' : '#475569';
  }

  if (section === 'outing') {
    scheme.primary = '#8C500A';
    scheme.onPrimary = '#FFFFFF';
    scheme.primaryContainer = isDark ? '#432203' : '#FDF7F2';
    scheme.onPrimaryContainer = isDark ? '#FED7AA' : '#78350F';
    scheme.secondary = isDark ? '#C88A58' : '#A05F0A';
    scheme.onSecondary = '#FFFFFF';
  }

  if (section === 'shopping') {
    scheme.primary = isDark ? '#254BB5' : '#172554';
    scheme.onPrimary = '#FFFFFF';
    scheme.primaryContainer = isDark ? '#0F172A' : '#EFF6FF';
    scheme.onPrimaryContainer = isDark ? '#BFDBFE' : '#172554';
    scheme.secondary = isDark ? '#93C5FD' : '#1E3A8A';
    scheme.onSecondary = '#FFFFFF';
  }

  if (section === 'vault') {
    scheme.primary = isDark ? '#3B82F6' : '#2034A0';
    scheme.onPrimary = '#FFFFFF';
    scheme.primaryContainer = isDark ? '#0C122B' : '#EEF2FF';
    scheme.onPrimaryContainer = isDark ? '#C7D2FE' : '#1E40AF';
    scheme.secondary = isDark ? '#818CF8' : '#1E40AF';
    scheme.onSecondary = '#FFFFFF';
  }

  if (colorFamilyOverride) {
    const tone = isDark ? colorFamilyOverride.dark : colorFamilyOverride;
    scheme.primary = tone.primary;
    scheme.onPrimary = getReadableForeground(tone.primary);
    scheme.primaryContainer = tone.surfaceSoft;
    scheme.onPrimaryContainer = tone.text;
    scheme.secondary = tone.accent;
    scheme.outline = tone.border;
    scheme.outlineVariant = tone.border;
  }

  const result: SectionM3Theme = {
    section,
    seedHex,
    isDark,
    scheme,
  };

  themeCache.set(cacheKey, result);
  return result;
}

/**
 * Writes all Material 3 CSS custom properties onto document.documentElement.style
 */
export function applyM3ThemeToDocument(scheme: M3ColorScheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Neutral scene background & accent blob
  root.style.setProperty('--md-scene-bg', scheme.sceneBg);
  root.style.setProperty('--md-on-scene-bg', scheme.onSceneBg);
  root.style.setProperty('--md-accent-blob', scheme.accentBlob);

  // Primary
  root.style.setProperty('--md-primary', scheme.primary);
  root.style.setProperty('--md-on-primary', scheme.onPrimary);
  root.style.setProperty('--md-primary-container', scheme.primaryContainer);
  root.style.setProperty('--md-on-primary-container', scheme.onPrimaryContainer);

  // Secondary
  root.style.setProperty('--md-secondary', scheme.secondary);
  root.style.setProperty('--md-on-secondary', scheme.onSecondary);
  root.style.setProperty('--md-secondary-container', scheme.secondaryContainer);
  root.style.setProperty('--md-on-secondary-container', scheme.onSecondaryContainer);

  // Tertiary
  root.style.setProperty('--md-tertiary', scheme.tertiary);
  root.style.setProperty('--md-on-tertiary', scheme.onTertiary);
  root.style.setProperty('--md-tertiary-container', scheme.tertiaryContainer);
  root.style.setProperty('--md-on-tertiary-container', scheme.onTertiaryContainer);

  // Error
  root.style.setProperty('--md-error', scheme.error);
  root.style.setProperty('--md-on-error', scheme.onError);
  root.style.setProperty('--md-error-container', scheme.errorContainer);
  root.style.setProperty('--md-on-error-container', scheme.onErrorContainer);

  // Surface & Tonal Containers
  root.style.setProperty('--md-surface', scheme.surface);
  root.style.setProperty('--md-on-surface', scheme.onSurface);
  root.style.setProperty('--md-surface-variant', scheme.surfaceVariant);
  root.style.setProperty('--md-on-surface-variant', scheme.onSurfaceVariant);

  root.style.setProperty('--md-surface-dim', scheme.surfaceDim);
  root.style.setProperty('--md-surface-bright', scheme.surfaceBright);
  root.style.setProperty('--md-surface-container-lowest', scheme.surfaceContainerLowest);
  root.style.setProperty('--md-surface-container-low', scheme.surfaceContainerLow);
  root.style.setProperty('--md-surface-container', scheme.surfaceContainer);
  root.style.setProperty('--md-surface-container-high', scheme.surfaceContainerHigh);
  root.style.setProperty('--md-surface-container-highest', scheme.surfaceContainerHighest);

  // Outline
  root.style.setProperty('--md-outline', scheme.outline);
  root.style.setProperty('--md-outline-variant', scheme.outlineVariant);
  root.style.setProperty('--md-inverse-surface', scheme.inverseSurface);
  root.style.setProperty('--md-inverse-on-surface', scheme.inverseOnSurface);
  root.style.setProperty('--md-inverse-primary', scheme.inversePrimary);

  // Shape scale
  root.style.setProperty('--md-shape-none', '0px');
  root.style.setProperty('--md-shape-xs', '4px');
  root.style.setProperty('--md-shape-sm', '8px');
  root.style.setProperty('--md-shape-md', '12px');
  root.style.setProperty('--md-shape-lg', '16px');
  root.style.setProperty('--md-shape-xl', '24px');
  root.style.setProperty('--md-shape-xxl', '28px');
  root.style.setProperty('--md-shape-full', '9999px');

  // Opacity helper: --md-primary-rgb
  const [pR, pG, pB] = hexToRgb(scheme.primary);
  root.style.setProperty('--md-primary-rgb', `${pR}, ${pG}, ${pB}`);
  root.style.setProperty('--primary-rgb', `${pR}, ${pG}, ${pB}`);

  const [sR, sG, sB] = hexToRgb(scheme.surface);
  root.style.setProperty('--surface-rgb', `${sR}, ${sG}, ${sB}`);

  const [bgR, bgG, bgB] = hexToRgb(scheme.sceneBg);
  root.style.setProperty('--scene-bg-rgb', `${bgR}, ${bgG}, ${bgB}`);

  // Set page background to M3 full-bleed sceneBg
  root.style.backgroundColor = scheme.sceneBg;
  root.style.color = scheme.onSurface;
  if (document.body) {
    document.body.style.backgroundColor = scheme.sceneBg;
    document.body.style.color = scheme.onSurface;
  }
}

/**
 * Category colors for module accents
 */
export const CATEGORY_COLORS = {
  streak: PALETTE.streak.seed,   // Flame Orange #FF6B35
  gym: '#22C55E',
  finance: PALETTE.finance.seed, // Forest Green #15803D
  nutrition: PALETTE.nutrition.seed, // Solar Amber #F5A623
  study: PALETTE.study.seed,     // Lagoon Cyan #0891B2
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLORS;

export function getCategoryBg(hex: string, opacity: number = 0.12): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
