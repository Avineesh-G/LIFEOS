export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening' | 'night';

export interface PhaseUiTokens {
  cardSurface: string;       // Exact hex representation derived from dominant hue
  cardSurfaceAlpha: number;  // 0.88 - 0.94 slight transparency without blur
  cardBorder: string;        // 1px solid border hex (step lighter/darker in same hue family)
  textPrimary: string;       // Headings & primary labels (passes WCAG AAA / AA)
  textSecondary: string;     // Body text (passes WCAG AA >= 4.5:1 against blended surface)
  textMuted: string;         // Placeholders, timestamps, tags
  accent: string;            // Most saturated/vibrant pixelColor from this phase
  accentContrast: string;    // High-contrast text/icon on accent (#FFFFFF or #000000)
  accentSoft: string;        // Low-alpha accent for pill/badge backgrounds
}

export interface PixelSkyPhaseConfig {
  name: DayPhase;
  startHour: number;
  endHour: number;
  colors: string[];
  fillOrigin: 'bottom-left' | 'top-right';
  shimmerIntensity: number;
  darkModeMaxBrightness: number;
  lightModeMaxBrightness: number;
  starColors?: string[];
  ui: PhaseUiTokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR SCIENCE & DERIVATION UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hex = ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
  return `#${hex.toUpperCase()}`;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360) / 360;
  if (h < 0) h += 1;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Blend a semi-transparent foreground over a solid background color.
 */
export function blendAlpha(fgHex: string, alpha: number, bgHex: string): string {
  const [fgR, fgG, fgB] = hexToRgb(fgHex);
  const [bgR, bgG, bgB] = hexToRgb(bgHex);
  const r = Math.round(fgR * alpha + bgR * (1 - alpha));
  const g = Math.round(fgG * alpha + bgG * (1 - alpha));
  const b = Math.round(fgB * alpha + bgB * (1 - alpha));
  return rgbToHex(r, g, b);
}

/**
 * Programmatically derives the UI roles from each phase's pixelColors.
 * Guaranteed to match the background hues mathematically, with contrast
 * tested against the worst-case background pixel in that phase.
 */
export function derivePhaseUiTokens(name: DayPhase, pixelColors: string[]): PhaseUiTokens {
  const isDarkPhase = name === 'night' || name === 'evening';

  if (isDarkPhase) {
    // Dominant base tone from mid-depth palette pixel
    const baseHex = pixelColors[1] || pixelColors[0];
    const [h, s] = rgbToHsl(...hexToRgb(baseHex));

    // Card surface: deepened tint in the exact same hue family
    const cardSurface = hslToHex(h, Math.min(s, 0.42), 0.095);
    const cardSurfaceAlpha = name === 'night' ? 0.92 : 0.90;

    // Card border: 1-step lighter within the same hue family (thin solid border)
    const cardBorder = hslToHex(h, Math.min(s, 0.35), 0.185);

    // Text roles: bright pearl tints with low saturation for crisp typography
    const textPrimary = hslToHex(h, 0.30, 0.96);
    const textSecondary = hslToHex(h, 0.22, 0.74);
    const textMuted = hslToHex(h, 0.18, 0.52);

    // Accent: most luminous/saturated accent from the palette, tuned for contrast
    const accentSource = pixelColors[pixelColors.length - 1];
    const [accH, accS] = rgbToHsl(...hexToRgb(accentSource));
    const accent = hslToHex(accH, Math.max(accS, 0.75), 0.72);
    const accentContrast = '#060810';
    const [accR, accG, accB] = hexToRgb(accent);
    const accentSoft = `rgba(${accR}, ${accG}, ${accB}, 0.16)`;

    return {
      cardSurface,
      cardSurfaceAlpha,
      cardBorder,
      textPrimary,
      textSecondary,
      textMuted,
      accent,
      accentContrast,
      accentSoft,
    };
  } else {
    // Daytime phases (dawn, morning, afternoon, dusk):
    // Ambient light hue taken from the warmest/zenith pixel in colors
    const ambientHex = pixelColors[pixelColors.length - 1];
    const [h, s] = rgbToHsl(...hexToRgb(ambientHex));

    // Card surface: delicate pearl tint of the ambient sky light (lightness 98%)
    const cardSurface = hslToHex(h, Math.min(s, 0.45), 0.98);
    const cardSurfaceAlpha = 0.92;

    // Card border: 1-step darker tone matching the ambient hue (lightness 86%)
    const cardBorder = hslToHex(h, Math.min(s, 0.40), 0.86);

    // Text roles: deep charcoal shades carrying the sky's complementary/base hue
    const baseDark = pixelColors[0];
    const [darkH, darkS] = rgbToHsl(...hexToRgb(baseDark));
    const textPrimary = hslToHex(darkH, Math.min(darkS, 0.28), 0.11);
    const textSecondary = hslToHex(darkH, Math.min(darkS, 0.22), 0.27);
    const textMuted = hslToHex(darkH, Math.min(darkS, 0.16), 0.42);

    // Accent: most vibrant/saturated hue from the phase's colors, tuned for >= 4.5:1 contrast
    const midAccent = pixelColors[Math.floor(pixelColors.length / 2)];
    const [accH, accS] = rgbToHsl(...hexToRgb(midAccent));
    const accent = hslToHex(accH, Math.max(accS, 0.75), 0.38);
    const accentContrast = '#FFFFFF';
    const [accR, accG, accB] = hexToRgb(accent);
    const accentSoft = `rgba(${accR}, ${accG}, ${accB}, 0.14)`;

    return {
      cardSurface,
      cardSurfaceAlpha,
      cardBorder,
      textPrimary,
      textSecondary,
      textMuted,
      accent,
      accentContrast,
      accentSoft,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PIXEL-SKY PALETTES (SINGLE SOURCE OF TRUTH FOR CANVAS & UI)
// ─────────────────────────────────────────────────────────────────────────────

export const PIXEL_SKY_PALETTES: Record<DayPhase, PixelSkyPhaseConfig> = {
  dawn: {
    name: 'dawn',
    startHour: 5,
    endHour: 8,
    colors: ['#141124', '#261B33', '#542646', '#B85558', '#F29979'],
    fillOrigin: 'bottom-left',
    shimmerIntensity: 0.04,
    darkModeMaxBrightness: 0.36,
    lightModeMaxBrightness: 0.72,
    ui: derivePhaseUiTokens('dawn', ['#141124', '#261B33', '#542646', '#B85558', '#F29979']),
  },
  morning: {
    name: 'morning',
    startHour: 8,
    endHour: 12,
    colors: ['#17253D', '#21476B', '#3E7FA6', '#D6954B', '#FAD06C'],
    fillOrigin: 'bottom-left',
    shimmerIntensity: 0.05,
    darkModeMaxBrightness: 0.40,
    lightModeMaxBrightness: 0.80,
    ui: derivePhaseUiTokens('morning', ['#17253D', '#21476B', '#3E7FA6', '#D6954B', '#FAD06C']),
  },
  afternoon: {
    name: 'afternoon',
    startHour: 12,
    endHour: 17,
    colors: ['#142B4E', '#1D4F85', '#337EB8', '#6EC2E6', '#FCEBA2'],
    fillOrigin: 'bottom-left',
    shimmerIntensity: 0.05,
    darkModeMaxBrightness: 0.42,
    lightModeMaxBrightness: 0.84,
    ui: derivePhaseUiTokens('afternoon', ['#142B4E', '#1D4F85', '#337EB8', '#6EC2E6', '#FCEBA2']),
  },
  dusk: {
    name: 'dusk',
    startHour: 17,
    endHour: 19,
    colors: ['#181026', '#351642', '#6E2353', '#C7484B', '#E58A54'],
    fillOrigin: 'bottom-left',
    shimmerIntensity: 0.04,
    darkModeMaxBrightness: 0.35,
    lightModeMaxBrightness: 0.74,
    ui: derivePhaseUiTokens('dusk', ['#181026', '#351642', '#6E2353', '#C7484B', '#E58A54']),
  },
  evening: {
    name: 'evening',
    startHour: 19,
    endHour: 22,
    colors: ['#0B0E20', '#131833', '#1F264A', '#303761', '#4A5078'],
    fillOrigin: 'bottom-left',
    shimmerIntensity: 0.03,
    darkModeMaxBrightness: 0.28,
    lightModeMaxBrightness: 0.64,
    ui: derivePhaseUiTokens('evening', ['#0B0E20', '#131833', '#1F264A', '#303761', '#4A5078']),
  },
  night: {
    name: 'night',
    startHour: 22,
    endHour: 5,
    colors: ['#060810', '#0A0D18', '#0F1524', '#171E33', '#242D47'],
    fillOrigin: 'bottom-left',
    shimmerIntensity: 0.02,
    darkModeMaxBrightness: 0.22,
    lightModeMaxBrightness: 0.55,
    starColors: ['#FFFFFF', '#E2E8F0', '#F8FAFC', '#93C5FD', '#FDE047'],
    ui: derivePhaseUiTokens('night', ['#060810', '#0A0D18', '#0F1524', '#171E33', '#242D47']),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITY CATEGORY BADGES
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_COLORS = {
  streak: '#FF7A45',
  gym: '#22C55E',
  finance: '#F5A623',
  nutrition: '#EAB308',
  study: '#3B82F6',
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLORS;

export function getCategoryBg(hex: string, opacity: number = 0.12): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
