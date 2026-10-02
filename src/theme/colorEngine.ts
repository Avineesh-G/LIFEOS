/**
 * Material 3 Expressive Color Scheme Engine
 * Uses Google's @material/material-color-utilities to generate
 * fully-accessible, contrast-compliant tonal palettes and system roles.
 */

import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors,
  Blend,
} from '@material/material-color-utilities';
import { getPaletteById, DEFAULT_PALETTE_ID } from './palettes';

export interface M3ColorScheme {
  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  inversePrimary: string;

  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Harmonized Semantic
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;

  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;

  // Surfaces & Background
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

  // Outlines & Inverse
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

const RAW_SUCCESS_HEX = '#2E7D32';
const RAW_WARNING_HEX = '#ED6C02';

/**
 * Generates an M3ColorScheme object for a given seed hex and mode (isDark)
 */
export function generateSchemeFromSeed(seedHex: string, isDark: boolean): M3ColorScheme {
  const seedArgb = argbFromHex(seedHex);
  const sourceHct = Hct.fromInt(seedArgb);
  const scheme = new SchemeTonalSpot(sourceHct, isDark, 0.0);

  // Dynamic colors resolution
  const primary = hexFromArgb(MaterialDynamicColors.primary.getArgb(scheme));
  const onPrimary = hexFromArgb(MaterialDynamicColors.onPrimary.getArgb(scheme));
  const primaryContainer = hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(scheme));
  const onPrimaryContainer = hexFromArgb(MaterialDynamicColors.onPrimaryContainer.getArgb(scheme));
  const inversePrimary = hexFromArgb(MaterialDynamicColors.inversePrimary.getArgb(scheme));

  const secondary = hexFromArgb(MaterialDynamicColors.secondary.getArgb(scheme));
  const onSecondary = hexFromArgb(MaterialDynamicColors.onSecondary.getArgb(scheme));
  const secondaryContainer = hexFromArgb(MaterialDynamicColors.secondaryContainer.getArgb(scheme));
  const onSecondaryContainer = hexFromArgb(MaterialDynamicColors.onSecondaryContainer.getArgb(scheme));

  const tertiary = hexFromArgb(MaterialDynamicColors.tertiary.getArgb(scheme));
  const onTertiary = hexFromArgb(MaterialDynamicColors.onTertiary.getArgb(scheme));
  const tertiaryContainer = hexFromArgb(MaterialDynamicColors.tertiaryContainer.getArgb(scheme));
  const onTertiaryContainer = hexFromArgb(MaterialDynamicColors.onTertiaryContainer.getArgb(scheme));

  const error = hexFromArgb(MaterialDynamicColors.error.getArgb(scheme));
  const onError = hexFromArgb(MaterialDynamicColors.onError.getArgb(scheme));
  const errorContainer = hexFromArgb(MaterialDynamicColors.errorContainer.getArgb(scheme));
  const onErrorContainer = hexFromArgb(MaterialDynamicColors.onErrorContainer.getArgb(scheme));

  // Harmonize semantic success & warning with current seed
  const harmonizedSuccessArgb = Blend.harmonize(argbFromHex(RAW_SUCCESS_HEX), seedArgb);
  const successScheme = new SchemeTonalSpot(Hct.fromInt(harmonizedSuccessArgb), isDark, 0.0);
  const success = hexFromArgb(MaterialDynamicColors.primary.getArgb(successScheme));
  const onSuccess = hexFromArgb(MaterialDynamicColors.onPrimary.getArgb(successScheme));
  const successContainer = hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(successScheme));
  const onSuccessContainer = hexFromArgb(MaterialDynamicColors.onPrimaryContainer.getArgb(successScheme));

  const harmonizedWarningArgb = Blend.harmonize(argbFromHex(RAW_WARNING_HEX), seedArgb);
  const warningScheme = new SchemeTonalSpot(Hct.fromInt(harmonizedWarningArgb), isDark, 0.0);
  const warning = hexFromArgb(MaterialDynamicColors.primary.getArgb(warningScheme));
  const onWarning = hexFromArgb(MaterialDynamicColors.onPrimary.getArgb(warningScheme));
  const warningContainer = hexFromArgb(MaterialDynamicColors.primaryContainer.getArgb(warningScheme));
  const onWarningContainer = hexFromArgb(MaterialDynamicColors.onPrimaryContainer.getArgb(warningScheme));

  const surface = hexFromArgb(MaterialDynamicColors.surface.getArgb(scheme));
  const onSurface = hexFromArgb(MaterialDynamicColors.onSurface.getArgb(scheme));
  const surfaceVariant = hexFromArgb(MaterialDynamicColors.surfaceVariant.getArgb(scheme));
  const onSurfaceVariant = hexFromArgb(MaterialDynamicColors.onSurfaceVariant.getArgb(scheme));
  const surfaceDim = hexFromArgb(MaterialDynamicColors.surfaceDim.getArgb(scheme));
  const surfaceBright = hexFromArgb(MaterialDynamicColors.surfaceBright.getArgb(scheme));
  const surfaceContainerLowest = hexFromArgb(MaterialDynamicColors.surfaceContainerLowest.getArgb(scheme));
  const surfaceContainerLow = hexFromArgb(MaterialDynamicColors.surfaceContainerLow.getArgb(scheme));
  const surfaceContainer = hexFromArgb(MaterialDynamicColors.surfaceContainer.getArgb(scheme));
  const surfaceContainerHigh = hexFromArgb(MaterialDynamicColors.surfaceContainerHigh.getArgb(scheme));
  const surfaceContainerHighest = hexFromArgb(MaterialDynamicColors.surfaceContainerHighest.getArgb(scheme));

  const outline = hexFromArgb(MaterialDynamicColors.outline.getArgb(scheme));
  const outlineVariant = hexFromArgb(MaterialDynamicColors.outlineVariant.getArgb(scheme));
  const shadow = hexFromArgb(MaterialDynamicColors.shadow.getArgb(scheme));
  const scrim = hexFromArgb(MaterialDynamicColors.scrim.getArgb(scheme));
  const inverseSurface = hexFromArgb(MaterialDynamicColors.inverseSurface.getArgb(scheme));
  const inverseOnSurface = hexFromArgb(MaterialDynamicColors.inverseOnSurface.getArgb(scheme));

  return {
    primary,
    onPrimary,
    primaryContainer,
    onPrimaryContainer,
    inversePrimary,
    secondary,
    onSecondary,
    secondaryContainer,
    onSecondaryContainer,
    tertiary,
    onTertiary,
    tertiaryContainer,
    onTertiaryContainer,
    error,
    onError,
    errorContainer,
    onErrorContainer,
    success,
    onSuccess,
    successContainer,
    onSuccessContainer,
    warning,
    onWarning,
    warningContainer,
    onWarningContainer,
    surface,
    onSurface,
    surfaceVariant,
    onSurfaceVariant,
    surfaceDim,
    surfaceBright,
    surfaceContainerLowest,
    surfaceContainerLow,
    surfaceContainer,
    surfaceContainerHigh,
    surfaceContainerHighest,
    outline,
    outlineVariant,
    shadow,
    scrim,
    inverseSurface,
    inverseOnSurface,
  };
}

/**
 * Returns a CSS variables dictionary for the given scheme
 */
export function schemeToCssVariables(scheme: M3ColorScheme): Record<string, string> {
  return {
    '--md-sys-color-primary': scheme.primary,
    '--md-sys-color-on-primary': scheme.onPrimary,
    '--md-sys-color-primary-container': scheme.primaryContainer,
    '--md-sys-color-on-primary-container': scheme.onPrimaryContainer,
    '--md-sys-color-inverse-primary': scheme.inversePrimary,

    '--md-sys-color-secondary': scheme.secondary,
    '--md-sys-color-on-secondary': scheme.onSecondary,
    '--md-sys-color-secondary-container': scheme.secondaryContainer,
    '--md-sys-color-on-secondary-container': scheme.onSecondaryContainer,

    '--md-sys-color-tertiary': scheme.tertiary,
    '--md-sys-color-on-tertiary': scheme.onTertiary,
    '--md-sys-color-tertiary-container': scheme.tertiaryContainer,
    '--md-sys-color-on-tertiary-container': scheme.onTertiaryContainer,

    '--md-sys-color-error': scheme.error,
    '--md-sys-color-on-error': scheme.onError,
    '--md-sys-color-error-container': scheme.errorContainer,
    '--md-sys-color-on-error-container': scheme.onErrorContainer,

    '--md-sys-color-success': scheme.success,
    '--md-sys-color-on-success': scheme.onSuccess,
    '--md-sys-color-success-container': scheme.successContainer,
    '--md-sys-color-on-success-container': scheme.onSuccessContainer,

    '--md-sys-color-warning': scheme.warning,
    '--md-sys-color-on-warning': scheme.onWarning,
    '--md-sys-color-warning-container': scheme.warningContainer,
    '--md-sys-color-on-warning-container': scheme.onWarningContainer,

    '--md-sys-color-surface': scheme.surface,
    '--md-sys-color-on-surface': scheme.onSurface,
    '--md-sys-color-surface-variant': scheme.surfaceVariant,
    '--md-sys-color-on-surface-variant': scheme.onSurfaceVariant,
    '--md-sys-color-surface-dim': scheme.surfaceDim,
    '--md-sys-color-surface-bright': scheme.surfaceBright,
    '--md-sys-color-surface-container-lowest': scheme.surfaceContainerLowest,
    '--md-sys-color-surface-container-low': scheme.surfaceContainerLow,
    '--md-sys-color-surface-container': scheme.surfaceContainer,
    '--md-sys-color-surface-container-high': scheme.surfaceContainerHigh,
    '--md-sys-color-surface-container-highest': scheme.surfaceContainerHighest,

    '--md-sys-color-outline': scheme.outline,
    '--md-sys-color-outline-variant': scheme.outlineVariant,
    '--md-sys-color-shadow': scheme.shadow,
    '--md-sys-color-scrim': scheme.scrim,
    '--md-sys-color-inverse-surface': scheme.inverseSurface,
    '--md-sys-color-inverse-on-surface': scheme.inverseOnSurface,

    // Bridge legacy variables to unified single M3 theme
    '--accent': scheme.primary,
    '--accent-primary': scheme.primary,
    '--accent-container': scheme.primaryContainer,
    '--accent-on-container': scheme.onPrimaryContainer,
    '--bg-app': scheme.surface,
    '--bg-surface': scheme.surface,
    '--bg-card': scheme.surfaceContainerLow,
    '--bg-card-elevated': scheme.surfaceContainer,
    '--card-surface': scheme.surfaceContainerLow,
    '--card-border': scheme.outlineVariant,
    '--border-card': scheme.outlineVariant,
    '--text-primary': scheme.onSurface,
    '--text-secondary': scheme.onSurfaceVariant,
    '--text-tertiary': scheme.outline,
    '--nav-bg': scheme.surfaceContainerHigh,
    '--nav-item-active': scheme.primary,
    '--nav-item-active-on': scheme.onPrimary,
    '--nav-item-inactive': scheme.onSurfaceVariant,
    '--nav-border': scheme.outlineVariant,
    '--dock-bg': scheme.surfaceContainerHigh,
    '--dock-border': scheme.outlineVariant,
  };
}

export function getSchemeForPalette(paletteId: string, isDark: boolean): M3ColorScheme {
  const palette = getPaletteById(paletteId);
  return generateSchemeFromSeed(palette.seed, isDark);
}
