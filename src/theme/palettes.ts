/**
 * Material 3 + iOS Liquid Glass Unified Single-Color Presets for LifeOS
 * Each preset drives one harmonized, high-legibility theme color across the whole app.
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

export const PALETTES: PaletteDefinition[] = [
  {
    id: 'burgundy',
    name: 'Royal Burgundy',
    seed: '#8B1E3F',
    secondarySeed: '#B52B4D',
    tertiarySeed: '#DE4B64',
    description: 'Deep wine burgundy with refined claret gradient',
    isDefault: true,
  },
  {
    id: 'ios-blue',
    name: 'iOS Liquid Blue',
    seed: '#0A84FF',
    secondarySeed: '#5AC8FA',
    tertiarySeed: '#64D2FF',
    description: 'Signature Apple iOS azure with crystal sky gradient',
  },
  {
    id: 'deep-navy',
    name: 'Sapphire Navy',
    seed: '#1E4E8C',
    secondarySeed: '#3A7BD5',
    tertiarySeed: '#6BA4FF',
    description: 'Structured sapphire with airy ice-blue gradient',
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    seed: '#0E8A5E',
    secondarySeed: '#24B47E',
    tertiarySeed: '#4CE0A8',
    description: 'Crisp emerald with delicate seafoam finish',
  },
  {
    id: 'indigo',
    name: 'Cosmic Indigo',
    seed: '#4E4CE0',
    secondarySeed: '#7674FF',
    tertiarySeed: '#9B99FF',
    description: 'iOS indigo with soft periwinkle mist',
  },
  {
    id: 'plum',
    name: 'Amethyst Plum',
    seed: '#73238F',
    secondarySeed: '#9B42BA',
    tertiarySeed: '#C77DFF',
    description: 'Rich M3 violet plum with subtle lavender sheen',
  },
  {
    id: 'teal',
    name: 'Lagoon Teal',
    seed: '#0B8793',
    secondarySeed: '#24B8C7',
    tertiarySeed: '#5CE1EE',
    description: 'Pure aqua teal with light crystal finish',
  },
  {
    id: 'rose',
    name: 'Crimson Berry',
    seed: '#A82648',
    secondarySeed: '#CF4064',
    tertiarySeed: '#E66380',
    description: 'Warm crimson berry with subtle claret sheen',
  },
  {
    id: 'amber-gold',
    name: 'Warm Amber',
    seed: '#C47600',
    secondarySeed: '#EB9B1A',
    tertiarySeed: '#FFB84D',
    description: 'Soft golden amber with luminous warm mist',
  },
  {
    id: 'terracotta',
    name: 'Burnt Terracotta',
    seed: '#A83F2B',
    secondarySeed: '#D45A42',
    tertiarySeed: '#EB7D67',
    description: 'Deep ember terracotta with warm copper wash',
  },
  {
    id: 'mocha',
    name: 'Warm Bronze',
    seed: '#7A5442',
    secondarySeed: '#A3755E',
    tertiarySeed: '#C99B84',
    description: 'Minimalist espresso bronze with sand highlight',
  },
  {
    id: 'slate',
    name: 'Graphite Mist',
    seed: '#52657A',
    secondarySeed: '#758CA3',
    tertiarySeed: '#9EB4CC',
    description: 'Neutral platinum slate with cool frost sheen',
  },
];

export const DEFAULT_PALETTE_ID = 'burgundy';
export const DEFAULT_THEME_MODE = 'dark' as const;

export function getPaletteById(id: string): PaletteDefinition {
  if (id === 'classic-burgundy') return PALETTES[0];
  if (id === 'material-ocean') return PALETTES[1];
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
