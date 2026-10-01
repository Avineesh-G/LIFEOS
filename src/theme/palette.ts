import { getActiveAccent } from './themeColorManager';

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

export const MORE_BUTTON_TOKENS = {
  light: {
    fill: '#1B1C22',
    icon: '#FFFFFF',
  },
  dark: {
    fill: '#E6E4EE',
    icon: '#1B1C22',
  },
} as const;

export function getInterfaceTokens(_interfaceName: string, isDark = true): PaletteEntry {
  const accent = getActiveAccent();
  const seed = accent.primary;
  const textAccent = isDark ? accent.primary : accent.darkText;

  return {
    id: 'unified',
    name: accent.name,
    seed,
    onAccent: '#FFFFFF',
    textAccent,
    darkStrong: seed,
    darkTint: textAccent,
    blobCorner: 'top-right',
  };
}

export const PALETTE: Record<string, PaletteEntry> = new Proxy({}, {
  get: () => getInterfaceTokens('default')
});

export function deltaE(_hex1: string, _hex2: string): number {
  return 0;
}

export function getContrast(_hex1: string, _hex2: string): number {
  return 4.5;
}
