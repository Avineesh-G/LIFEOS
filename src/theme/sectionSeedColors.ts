import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from '@material/material-color-utilities';

import { getActiveAccent, type ThemeAccent } from './themeColorManager.ts';

export type AppSection =
  | 'home'
  | 'finance'
  | 'gym'
  | 'nutrition'
  | 'study'
  | 'timetable'
  | 'tasks'
  | 'laundry'
  | 'settings'
  | 'history'
  | 'outing'
  | 'shopping'
  | 'vault'
  | 'notes';

export function getSectionFromPathname(pathname: string): AppSection {
  const p = pathname.toLowerCase();
  if (p.startsWith('/gym')) return 'gym';
  if (p.startsWith('/nutrition')) return 'nutrition';
  if (p.startsWith('/spending') || p.startsWith('/finance')) return 'finance';
  if (p.startsWith('/study')) return 'study';
  if (p.startsWith('/timetable')) return 'timetable';
  if (p.startsWith('/tasks')) return 'tasks';
  if (p.startsWith('/laundry')) return 'laundry';
  if (p.startsWith('/settings')) return 'settings';
  if (p.startsWith('/history')) return 'history';
  if (p.startsWith('/outings')) return 'outing';
  if (p.startsWith('/shopping')) return 'shopping';
  if (p.startsWith('/vault')) return 'vault';
  if (p.startsWith('/notes')) return 'notes';
  return 'home';
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
  timetable: 'top-right',
  tasks: 'top-left',
  laundry: 'bottom-right',
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

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export function blendHex(baseHex: string, tintHex: string, ratio: number = 0.05): string {
  const [r1, g1, b1] = hexToRgb(baseHex);
  const [r2, g2, b2] = hexToRgb(tintHex);
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getM3ThemeForSection(
  section: AppSection,
  isDark: boolean,
  accentOverride?: ThemeAccent
): SectionM3Theme {
  const active = accentOverride || getActiveAccent();
  const seedHex = active.primary;
  const sourceArgb = argbFromHex(seedHex);
  const theme = themeFromSourceColor(sourceArgb);

  const rawScheme = isDark ? theme.schemes.dark : theme.schemes.light;
  const neutral = theme.palettes.neutral;

  const baseLight = '#FAF8F8';
  const baseDark = '#111318';
  const sceneBg = isDark ? blendHex(baseDark, seedHex, 0.04) : blendHex(baseLight, seedHex, 0.03);
  const onSceneBg = isDark ? '#F2F3F5' : '#1E2024';

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
    onSurfaceVariant: isDark ? '#B8BBC3' : '#575B66',
    surfaceDim,
    surfaceBright,
    surfaceContainerLowest,
    surfaceContainerLow,
    surfaceContainer,
    surfaceContainerHigh,
    surfaceContainerHighest,
    outline: isDark ? '#858994' : '#808593',
    outlineVariant: hexFromArgb(rawScheme.outlineVariant),
    inverseSurface: hexFromArgb(rawScheme.inverseSurface),
    inverseOnSurface: hexFromArgb(rawScheme.inverseOnSurface),
    inversePrimary: hexFromArgb(rawScheme.inversePrimary),
    shadow: hexFromArgb(rawScheme.shadow),
    scrim: hexFromArgb(rawScheme.scrim),
    sceneBg,
    onSceneBg,
    accentBlob: seedHex,
    blobPosition: SECTION_BLOB_POSITIONS[section] || 'top-right',
  };

  return {
    section,
    seedHex,
    isDark,
    scheme,
  };
}

export function applyM3ThemeToDocument(scheme: M3ColorScheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--md-primary', scheme.primary);
  root.style.setProperty('--md-on-primary', scheme.onPrimary);
  root.style.setProperty('--md-primary-container', scheme.primaryContainer);
  root.style.setProperty('--md-on-primary-container', scheme.onPrimaryContainer);

  root.style.setProperty('--md-surface', scheme.surface);
  root.style.setProperty('--md-on-surface', scheme.onSurface);
  root.style.setProperty('--md-surface-variant', scheme.surfaceVariant);
  root.style.setProperty('--md-on-surface-variant', scheme.onSurfaceVariant);

  root.style.setProperty('--md-surface-container-lowest', scheme.surfaceContainerLowest);
  root.style.setProperty('--md-surface-container-low', scheme.surfaceContainerLow);
  root.style.setProperty('--md-surface-container', scheme.surfaceContainer);
  root.style.setProperty('--md-surface-container-high', scheme.surfaceContainerHigh);
  root.style.setProperty('--md-surface-container-highest', scheme.surfaceContainerHighest);

  root.style.setProperty('--md-outline', scheme.outline);
  root.style.setProperty('--md-outline-variant', scheme.outlineVariant);
  root.style.setProperty('--scene-bg', scheme.sceneBg);
  root.style.setProperty('--on-scene-bg', scheme.onSceneBg);
  root.style.setProperty('--accent-blob', scheme.accentBlob);
}

export function getNavPillBg(_section: AppSection, isDark: boolean, _pathname?: string): string {
  const accent = getActiveAccent();
  const [r, g, b] = hexToRgb(accent.primary);
  return isDark
    ? `rgba(${Math.round(r * 0.12 + 8)}, ${Math.round(g * 0.12 + 12)}, ${Math.round(b * 0.12 + 16)}, 0.88)`
    : `rgba(255, 255, 255, 0.88)`;
}

export function getNavSquircleBg(_section: AppSection, isDark: boolean, _pathname?: string): string {
  const accent = getActiveAccent();
  return isDark ? accent.primary : accent.darkText;
}
