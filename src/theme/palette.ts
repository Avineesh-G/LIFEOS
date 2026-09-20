/**
 * LifeOS — Distinct Interface Color Palette (Single Source of Truth)
 * 
 * Every interface has its own clearly distinct color in light and dark mode,
 * mathematically validated using OKLab ΔE × 100 perceptual distance.
 * 
 * Scope Lock Rules:
 * - Minimum ΔE between seed pairs: ≥ 13.0
 * - Minimum ΔE between dark strong fill pairs: ≥ 10.0
 * - Minimum ΔE between dark tint pairs: ≥ 7.5
 * - On-accent text contrast on seed and dark strong fill: ≥ 4.5:1
 * - Text accent contrast on #FDFDFD: ≥ 4.5:1
 * - Dark tint contrast on #121316: ≥ 4.5:1
 * - Dark strong fill contrast on #121316: ≥ 3.0:1
 * - Zero duplicate role values across entries
 */

export interface PaletteEntry {
  id: string;
  name: string;
  seed: string;
  onAccent: string;
  textAccent: string;
  darkStrong: string;
  darkTint: string;
  blobCorner: 'top-right' | 'bottom-left' | 'bottom-right' | 'top-left' | 'none';
}

export const PALETTE: Record<string, PaletteEntry> = {
  home: {
    id: 'home',
    name: 'Home (Royal Blue)',
    seed: '#2563EB',
    onAccent: '#FFFFFF',
    textAccent: '#2563EB',
    darkStrong: '#2563EB',
    darkTint: '#8DB0FF',
    blobCorner: 'top-right',
  },
  gym: {
    id: 'gym',
    name: 'Gym (Coral Crimson)',
    seed: '#E11D48',
    onAccent: '#FFFFFF',
    textAccent: '#E11D48',
    darkStrong: '#E11D48',
    darkTint: '#FB7185',
    blobCorner: 'bottom-left',
  },
  nutrition: {
    id: 'nutrition',
    name: 'Nutrition (Solar Amber)',
    seed: '#F5A623',
    onAccent: '#1A1A1F',
    textAccent: '#9F6803',
    darkStrong: '#F5A623',
    darkTint: '#FBC15E',
    blobCorner: 'bottom-right',
  },
  finance: {
    id: 'finance',
    name: 'Finance & Spending (Forest Green)',
    seed: '#15803D',
    onAccent: '#FFFFFF',
    textAccent: '#15803D',
    darkStrong: '#15803D',
    darkTint: '#82CB92',
    blobCorner: 'top-left',
  },
  study: {
    id: 'study',
    name: 'Study & Timetable (Lagoon Cyan)',
    seed: '#0891B2',
    onAccent: '#1A1A1F',
    textAccent: '#0E7D9A',
    darkStrong: '#0891B2',
    darkTint: '#80D2ED',
    blobCorner: 'top-right',
  },
  settings: {
    id: 'settings',
    name: 'Settings & Vault (Slate)',
    seed: '#475569',
    onAccent: '#FFFFFF',
    textAccent: '#475569',
    darkStrong: '#556378',
    darkTint: '#A7AEBB',
    blobCorner: 'bottom-left',
  },
  history: {
    id: 'history',
    name: 'History (Burgundy)',
    seed: '#8C1D40',
    onAccent: '#FFFFFF',
    textAccent: '#8C1D40',
    darkStrong: '#AA3B58',
    darkTint: '#D66FA0',
    blobCorner: 'bottom-right',
  },
  outing: {
    id: 'outing',
    name: 'Outing Expenses (Saddle Brown)',
    seed: '#8C500A',
    onAccent: '#FFFFFF',
    textAccent: '#78350F',
    darkStrong: '#A05F0A',
    darkTint: '#C88A58',
    blobCorner: 'top-right',
  },
  streak: {
    id: 'streak',
    name: 'Streak Badges (Flame Orange)',
    seed: '#FF6B35',
    onAccent: '#1A1A1F',
    textAccent: '#CB470D',
    darkStrong: '#FF6B35',
    darkTint: '#FCA487',
    blobCorner: 'none',
  },
};

// ── OKLab & Contrast Mathematics ──

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export const hexToLinearRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  return [
    lin(parseInt(clean.slice(0, 2), 16) / 255),
    lin(parseInt(clean.slice(2, 4), 16) / 255),
    lin(parseInt(clean.slice(4, 6), 16) / 255),
  ];
};

export function toOklab(hex: string): [number, number, number] {
  const [r, g, b] = hexToLinearRgb(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

export const deltaE = (a: string, b: string): number => {
  const A = toOklab(a);
  const B = toOklab(b);
  return 100 * Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
};

export function getContrast(hexA: string, hexB: string): number {
  const getLum = (hex: string) => {
    const [r, g, b] = hexToLinearRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [getLum(hexA), getLum(hexB)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Extracts active interface tokens for runtime style injection
 */
export function getInterfaceTokens(sectionKey: string, isDark: boolean) {
  const entry = PALETTE[sectionKey] || PALETTE.home;
  return {
    accent: isDark ? entry.darkStrong : entry.seed,
    seed: entry.seed,
    onAccent: entry.onAccent,
    textAccent: isDark ? entry.darkTint : entry.textAccent,
    darkStrong: entry.darkStrong,
    darkTint: entry.darkTint,
    blobCorner: entry.blobCorner,
  };
}
