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
    seed: '#800020',
    description: 'Classic rich burgundy (#800020) — deep wine in light mode, luminous pink-wine primary in dark mode',
    isDefault: true,
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    seed: '#1E6FD9',
    description: 'Crisp energetic cobalt blue',
  },
  {
    id: 'teal',
    name: 'Teal',
    seed: '#0F8B8D',
    description: 'Modern botanical cyan-teal',
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    seed: '#2E7D4F',
    description: 'Natural balanced evergreen',
  },
  {
    id: 'amber',
    name: 'Amber',
    seed: '#C77700',
    description: 'Warm vibrant golden amber',
  },
  {
    id: 'violet',
    name: 'Violet',
    seed: '#6D4AFF',
    description: 'Expressive rich royal violet',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    seed: '#5F6B76',
    description: 'Refined neutral slate',
  },
];

export const DEFAULT_PALETTE_ID = 'burgundy';
export const DEFAULT_THEME_MODE = 'system' as const;

export function getPaletteById(id: string): PaletteDefinition {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
