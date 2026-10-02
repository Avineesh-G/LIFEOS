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
    id: 'classic-burgundy',
    name: 'Classic Burgundy',
    seed: '#800020',
    description: 'Iconic flagship burgundy (#800020) — deep wine in light mode, luminous pink-wine in dark mode',
    isDefault: true,
  },
  {
    id: 'midnight-burgundy',
    name: 'Midnight Burgundy',
    seed: '#35000C',
    description: 'Ultra-deep ink burgundy with obsidian undertones (#35000C)',
  },
  {
    id: 'deep-burgundy',
    name: 'Deep Burgundy',
    seed: '#4A0012',
    description: 'Heavy vintage cabernet wine tone (#4A0012)',
  },
  {
    id: 'dark-burgundy',
    name: 'Dark Burgundy',
    seed: '#5C0018',
    description: 'Rich dark Bordeaux velvet (#5C0018)',
  },
  {
    id: 'maroon-burgundy',
    name: 'Maroon Burgundy',
    seed: '#6D001E',
    description: 'Intense crimson-maroon profile (#6D001E)',
  },
  {
    id: 'rich-burgundy',
    name: 'Rich Burgundy',
    seed: '#8B1E3F',
    description: 'Vibrant ruby-tinted berry burgundy (#8B1E3F)',
  },
  {
    id: 'royal-burgundy',
    name: 'Royal Burgundy',
    seed: '#92243F',
    description: 'Expressive jewel-toned royal garnet (#92243F)',
  },
  {
    id: 'warm-burgundy',
    name: 'Warm Burgundy',
    seed: '#9E3048',
    description: 'Warm terracotta-infused wine red (#9E3048)',
  },
  {
    id: 'soft-burgundy',
    name: 'Soft Burgundy',
    seed: '#A83D55',
    description: 'Softened mellow plum burgundy (#A83D55)',
  },
  {
    id: 'rose-burgundy',
    name: 'Rose Burgundy',
    seed: '#B66A7A',
    description: 'Luminous antique rose burgundy (#B66A7A)',
  },
];

export const DEFAULT_PALETTE_ID = 'classic-burgundy';
export const DEFAULT_THEME_MODE = 'light' as const;

export function getPaletteById(id: string): PaletteDefinition {
  if (id === 'burgundy') return PALETTES[0];
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}

