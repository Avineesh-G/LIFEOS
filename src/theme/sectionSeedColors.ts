import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors,
} from '@material/material-color-utilities';

import { getActiveAccent, type ThemeAccent } from './themeColorManager.ts';

export type AppSection =
  | 'home'
  | 'calendar'
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
  | 'notes'
  | 'ai';

export function getSectionFromPathname(pathname: string): AppSection {
  const p = pathname.toLowerCase();
  if (p.startsWith('/ai') || p.startsWith('/chat')) return 'ai';
  if (p.startsWith('/calendar')) return 'calendar';
  if (p.startsWith('/gym')) return 'gym';
  if (p.startsWith('/nutrition')) return 'nutrition';
  if (p.startsWith('/spending') || p.startsWith('/finance')) return 'finance';
  if (p.startsWith('/study') || p.startsWith('/drive')) return 'study';
  if (p.startsWith('/timetable')) return 'timetable';
  if (p.startsWith('/tasks')) return 'tasks';
  if (p.startsWith('/laundry')) return 'laundry';
  if (p.startsWith('/settings')) return 'settings';
  if (p.startsWith('/history')) return 'history';
  if (p.startsWith('/outings')) return 'outing';
  if (p.startsWith('/shopping')) return 'shopping';
  if (p.startsWith('/vault')) return 'vault';
  if (p.startsWith('/notes')) return 'notes';
  if (p.startsWith('/flow') || p.startsWith('/recall') || p.startsWith('/transcribe')) return 'study';
  if (p.startsWith('/morning')) return 'home';
  if (p.startsWith('/brain-dump')) return 'notes';
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
  moduleAccent: string;
  moduleSecondary: string;
  moduleTertiary: string;
}

export type BlobPosition = 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'top-center';

export const SECTION_BLOB_POSITIONS: Record<AppSection, BlobPosition> = {
  home: 'top-right',
  calendar: 'top-right',
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
  ai: 'top-center',
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

export function blendHex(baseHex: string, tintHex: string, ratio: number = 0.03): string {
  const [r1, g1, b1] = hexToRgb(baseHex);
  const [r2, g2, b2] = hexToRgb(tintHex);
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Single Unified Theme Accent across ALL sections (follows one color across the entire page/app).
 */
export function getHarmonizedModuleSeed(_section: AppSection, presetSeedHex: string): string {
  return presetSeedHex;
}

export function getM3ThemeForSection(
  section: AppSection,
  _isDark: boolean,
  accentOverride?: ThemeAccent
): SectionM3Theme {
  const active = accentOverride || getActiveAccent();
  const presetSeedHex = active.primary;
  const presetScheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(presetSeedHex)), true, 0.0);

  const moduleAccent = active.primary;
  const moduleSecondary = active.secondary || hexFromArgb(MaterialDynamicColors.secondary.getArgb(presetScheme));
  const moduleTertiary = active.tertiary || active.secondary || hexFromArgb(MaterialDynamicColors.tertiary.getArgb(presetScheme));

  // Crisp pure iOS obsidian surfaces with only a feather-light 2%-4% ambient tonal whisper
  const sceneBg = '#000000';
  const onSceneBg = '#FFFFFF';
  const surface = blendHex('#141416', moduleAccent, 0.025);
  const surfaceContainerLowest = '#000000';
  const surfaceContainerLow = blendHex('#141417', moduleAccent, 0.025);
  const surfaceContainer = blendHex('#18181C', moduleAccent, 0.035);
  const surfaceContainerHigh = blendHex('#1E1E24', moduleAccent, 0.045);
  const surfaceContainerHighest = blendHex('#282830', moduleAccent, 0.055);
  const onSurface = '#FFFFFF';

  const surfaceDim = '#101013';
  const surfaceBright = surfaceContainerHigh;

  const scheme: M3ColorScheme = {
    primary: moduleAccent,
    onPrimary: hexFromArgb(MaterialDynamicColors.onPrimary.getArgb(presetScheme)),
    primaryContainer: hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(presetScheme)),
    onPrimaryContainer: hexFromArgb(MaterialDynamicColors.onPrimaryContainer.getArgb(presetScheme)),
    secondary: moduleSecondary,
    onSecondary: hexFromArgb(MaterialDynamicColors.onSecondary.getArgb(presetScheme)),
    secondaryContainer: hexFromArgb(MaterialDynamicColors.secondaryContainer.getArgb(presetScheme)),
    onSecondaryContainer: hexFromArgb(MaterialDynamicColors.onSecondaryContainer.getArgb(presetScheme)),
    tertiary: moduleTertiary,
    onTertiary: hexFromArgb(MaterialDynamicColors.onTertiary.getArgb(presetScheme)),
    tertiaryContainer: hexFromArgb(MaterialDynamicColors.tertiaryContainer.getArgb(presetScheme)),
    onTertiaryContainer: hexFromArgb(MaterialDynamicColors.onTertiaryContainer.getArgb(presetScheme)),
    error: '#FF453A',
    onError: '#FFFFFF',
    errorContainer: 'rgba(255, 69, 58, 0.16)',
    onErrorContainer: '#FFB4AF',
    surface,
    onSurface,
    surfaceVariant: surfaceContainerHigh,
    onSurfaceVariant: 'rgba(240, 240, 245, 0.72)',
    surfaceDim,
    surfaceBright,
    surfaceContainerLowest,
    surfaceContainerLow,
    surfaceContainer,
    surfaceContainerHigh,
    surfaceContainerHighest,
    outline: 'rgba(255, 255, 255, 0.12)',
    outlineVariant: 'rgba(255, 255, 255, 0.07)',
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#000000',
    inversePrimary: hexFromArgb(MaterialDynamicColors.inversePrimary.getArgb(presetScheme)),
    shadow: '#000000',
    scrim: '#000000',
    sceneBg,
    onSceneBg,
    accentBlob: moduleAccent,
    blobPosition: SECTION_BLOB_POSITIONS[section] || 'top-right',
    moduleAccent,
    moduleSecondary,
    moduleTertiary,
  };

  return {
    section,
    seedHex: moduleAccent,
    isDark: true,
    scheme,
  };
}

export function applyM3ThemeToDocument(scheme: M3ColorScheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const [mr, mg, mb] = hexToRgb(scheme.moduleAccent);

  root.style.setProperty('--md-primary', scheme.primary);
  root.style.setProperty('--md-on-primary', scheme.onPrimary);
  root.style.setProperty('--md-primary-container', scheme.primaryContainer);
  root.style.setProperty('--md-on-primary-container', scheme.onPrimaryContainer);

  root.style.setProperty('--md-secondary', scheme.secondary);
  root.style.setProperty('--md-on-secondary', scheme.onSecondary);
  root.style.setProperty('--md-secondary-container', scheme.secondaryContainer);
  root.style.setProperty('--md-on-secondary-container', scheme.onSecondaryContainer);

  root.style.setProperty('--md-tertiary', scheme.tertiary);
  root.style.setProperty('--md-on-tertiary', scheme.onTertiary);
  root.style.setProperty('--md-tertiary-container', scheme.tertiaryContainer);
  root.style.setProperty('--md-on-tertiary-container', scheme.onTertiaryContainer);

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

  // Unified single-hue accent tokens across all interfaces & sub-cards
  root.style.setProperty('--module-accent', scheme.moduleAccent);
  root.style.setProperty('--module-accent-rgb', `${mr}, ${mg}, ${mb}`);
  root.style.setProperty('--module-secondary', scheme.moduleSecondary);
  root.style.setProperty('--module-tertiary', scheme.moduleTertiary);
  root.style.setProperty('--hero-accent', scheme.moduleAccent);
  root.style.setProperty('--card-accent', scheme.moduleAccent);
  root.style.setProperty('--tile-accent', scheme.moduleAccent);
  root.style.setProperty('--pill-accent', scheme.moduleAccent);
  root.style.setProperty(
    '--module-gradient',
    `linear-gradient(135deg, ${scheme.moduleAccent} 0%, ${scheme.moduleSecondary} 100%)`
  );
}

export function getNavPillBg(_section: AppSection, isDark: boolean, _pathname?: string): string {
  const active = getActiveAccent();
  const [r, g, b] = hexToRgb(active.primary);
  return isDark
    ? `rgba(${Math.round(r * 0.05 + 16)}, ${Math.round(g * 0.05 + 16)}, ${Math.round(b * 0.05 + 20)}, 0.92)`
    : `rgba(255, 255, 255, 0.88)`;
}

export function getNavSquircleBg(_section: AppSection, isDark: boolean, _pathname?: string): string {
  const accent = getActiveAccent();
  return isDark ? (accent.tertiary || accent.secondary || accent.primary) : accent.darkText;
}
