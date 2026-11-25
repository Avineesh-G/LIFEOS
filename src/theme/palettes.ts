/**
 * Fixed Single-Color Liquid Glass Theme for LifeOS
 * Warm Brown (#7B4B36 -> #A46D52, high-contrast sand highlight #D29B7E)
 * is locked across every interface, card, icon, and surface.
 */

export interface PaletteDefinition {
  id: string;
  name: string;
  seed: string;
  secondarySeed: string;
  tertiarySeed: string;
  description: string;
  isDefault?: boolean;
}

export const WARM_BROWN_PALETTE: PaletteDefinition = {
  id: 'warm-brown',
  name: 'Warm Brown',
  seed: '#7B4B36',
  secondarySeed: '#A46D52',
  tertiarySeed: '#D29B7E',
  description: 'Fixed warm chestnut brown with subtle sand Liquid Glass gradient',
  isDefault: true,
};

export const PALETTES: PaletteDefinition[] = [WARM_BROWN_PALETTE];

export const DEFAULT_PALETTE_ID = 'warm-brown';
export const DEFAULT_THEME_MODE = 'dark' as const;

export function getPaletteById(_id?: string): PaletteDefinition {
  return WARM_BROWN_PALETTE;
}
