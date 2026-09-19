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

export type AppSection = 'home' | 'finance' | 'gym' | 'nutrition' | 'study' | 'settings';

/**
 * Fixed identity seed color per section
 */
export const SECTION_SEED_COLORS: Record<AppSection, string> = {
  home: '#2563EB',      // Royal Blue
  finance: '#7C3AED',   // Twilight Violet
  gym: '#E11D48',       // Coral Crimson
  nutrition: '#F5A623', // Solar Amber
  study: '#0284C7',     // Sky Blue
  settings: '#4F46E5',  // Midnight Indigo
};

/**
 * Pale tonal container colors for Navigation Bar Pill
 * - Light mode: 90–94% tone of that hue (soft, desaturated, closer to white than accent)
 * - Dark mode: 20–25% tone of that hue (soft, desaturated, closer to near-black #121316 than accent)
 */
export const NAV_PILL_BG_COLORS: Record<AppSection, { light: string; dark: string }> = {
  home: { light: '#E0E9FC', dark: '#162545' },       // pale tonal container from #2563EB
  gym: { light: '#FBDFE5', dark: '#381620' },        // pale tonal container from #E11D48
  nutrition: { light: '#FEF3E0', dark: '#3A2A14' },  // pale tonal container from #F5A623
  finance: { light: '#EDE3FC', dark: '#25183D' },    // pale tonal container from #7C3AED
  study: { light: '#DCEEF7', dark: '#0F2636' },      // pale tonal container from #0284C7
  settings: { light: '#E6E5FB', dark: '#1E1D3D' },   // pale tonal container from #4F46E5
};

export function getNavPillBg(section: AppSection, isDark: boolean): string {
  const tones = NAV_PILL_BG_COLORS[section] || NAV_PILL_BG_COLORS.home;
  return isDark ? tones.dark : tones.light;
}

export function getNavSquircleBg(section: AppSection, isDark: boolean): string {
  const seed = SECTION_SEED_COLORS[section] || SECTION_SEED_COLORS.home;
  if (!isDark) return seed;
  if (section === 'home') return '#3B82F6';      // slightly lightened for AA contrast against #121316
  if (section === 'gym') return '#F43F5E';       // slightly lightened for AA contrast against #121316
  if (section === 'settings') return '#6366F1';  // slightly lightened indigo for AA contrast against #121316
  if (section === 'finance') return '#8B5CF6';   // slightly lightened violet for AA contrast against #121316
  if (section === 'study') return '#0EA5E9';     // slightly lightened sky for AA contrast against #121316
  return seed;
}


/**
 * Maps any pathname in LifeOS to its canonical AppSection
 */
export function getSectionFromPathname(pathname: string): AppSection {
  const p = (pathname || '/').toLowerCase();
  if (p.startsWith('/spending') || p.startsWith('/shopping')) {
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
  if (p.startsWith('/settings') || p.startsWith('/vault')) {
    return 'settings';
  }
  return 'home'; // '/', '/tasks', '/progress', '/history', '/laundry'
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
export function getM3ThemeForSection(section: AppSection, isDark: boolean): SectionM3Theme {
  const cacheKey = `${section}:${isDark ? 'dark' : 'light'}`;
  const cached = themeCache.get(cacheKey);
  if (cached) return cached;

  const seedHex = SECTION_SEED_COLORS[section] || SECTION_SEED_COLORS.home;
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
  streak: '#FF7A45',
  gym: '#22C55E',
  finance: '#7C3AED',
  nutrition: '#F5A623',
  study: '#0284C7',
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLORS;

export function getCategoryBg(hex: string, opacity: number = 0.12): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
