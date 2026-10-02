/**
 * Material 3 Expressive Color Palettes for LifeOS
 * Single source of truth for all seed colors and palette definitions.
 */

export interface PaletteDefinition {
  id: string;
  name: string;
  seed: string;
  description: string;
  isDefault?: boolean;
}

export const PALETTES: PaletteDefinition[] = [
  {
    id: 'burgundy',
    name: 'Burgundy',
    seed: '#8B1E3F',
    description: 'Expressive ruby burgundy (#8B1E3F)',
    isDefault: true,
  },
  {
    id: 'deep-navy',
    name: 'Deep Navy',
    seed: '#183B5B',
    description: 'Professional + sophisticated (#183B5B)',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    seed: '#087F5B',
    description: 'Fresh + modern (#087F5B)',
  },
  {
    id: 'plum',
    name: 'Plum',
    seed: '#6A1B6D',
    description: 'Expressive + luxurious (#6A1B6D)',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    seed: '#4936A3',
    description: 'Modern + slightly futuristic (#4936A3)',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    seed: '#A84A32',
    description: 'Warm + distinctive (#A84A32)',
  },
  {
    id: 'teal',
    name: 'Teal',
    seed: '#087F83',
    description: 'Clean + technological (#087F83)',
  },
  {
    id: 'rose',
    name: 'Rose',
    seed: '#A83F5D',
    description: 'Soft + expressive (#A83F5D)',
  },
  {
    id: 'mocha',
    name: 'Mocha',
    seed: '#765548',
    description: 'Warm + minimal (#765548)',
  },
  {
    id: 'slate',
    name: 'Slate',
    seed: '#53616D',
    description: 'Neutral + professional (#53616D)',
  },
];

export const DEFAULT_PALETTE_ID = 'burgundy';
export const DEFAULT_THEME_MODE = 'light' as const;

export function getPaletteById(id: string): PaletteDefinition {
  if (id === 'classic-burgundy') return PALETTES[0];
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}


