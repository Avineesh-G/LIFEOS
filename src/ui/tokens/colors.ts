/**
 * LifeOS "LifeOS Black" Color Tokens
 * Liquid Glass Specification Section 4.1
 */

export interface ColorTokens {
  canvas: string;
  surface1: string;
  surface2: string;
  surface3: string;
  separator: string;
  text1: string;
  text2: string;
  text3: string;
  fillGlass: string;
  danger: string;
}

export const DARK_COLORS: ColorTokens = {
  canvas: '#000000',
  surface1: '#1C1C1E',
  surface2: '#2C2C2E',
  surface3: '#3A3A3C',
  separator: '#38383A',
  text1: '#FFFFFF',
  text2: 'rgba(240, 240, 245, 0.78)',
  text3: 'rgba(235, 235, 245, 0.52)',
  fillGlass: 'rgba(44, 44, 48, 0.60)',
  danger: '#FF453A',
};

export const LIGHT_COLORS: ColorTokens = {
  canvas: '#F2F2F7',
  surface1: '#FFFFFF',
  surface2: '#E5E5EA',
  surface3: '#D1D1D6',
  separator: '#C6C6C8',
  text1: '#000000',
  text2: 'rgba(60, 60, 67, 0.60)',
  text3: 'rgba(60, 60, 67, 0.30)',
  fillGlass: 'rgba(255, 255, 255, 0.65)',
  danger: '#FF3B30',
};

export type ModuleKey =
  | 'home'
  | 'gym'
  | 'nutrition'
  | 'study'
  | 'flow'
  | 'timetable'
  | 'spending'
  | 'outing'
  | 'shopping'
  | 'tasks'
  | 'laundry'
  | 'notes'
  | 'flashcards'
  | 'braindump'
  | 'transcriber'
  | 'vault'
  | 'history'
  | 'streak'
  | 'luna';

export const MODULE_TINTS: Record<ModuleKey, string> = {
  home: '#0A84FF',        // Blue
  gym: '#FF453A',         // Coral red
  nutrition: '#FF9F0A',   // Orange
  study: '#64D2FF',       // Cyan
  flow: '#64D2FF',        // Cyan
  timetable: '#5E5CE6',   // Indigo
  spending: '#30D158',    // Green
  outing: '#40C8E0',      // Teal
  shopping: '#FF375F',    // Pink
  tasks: '#0A84FF',       // Blue
  laundry: '#63E6E2',     // Mint
  notes: '#FFD60A',       // Yellow
  flashcards: '#BF5AF2',  // Purple
  braindump: '#BF5AF2',   // Purple
  transcriber: '#FF6B35', // Red-orange
  vault: '#8E7CFF',       // Violet
  history: '#AC8E68',     // Tan
  streak: '#FF7A45',      // Flame
  luna: '#BF5AF2',        // Luna base
};

export const LUNA_GRADIENT = ['#0A84FF', '#BF5AF2', '#FF375F'];

export function getModuleTint(key?: string | null, customAccent?: string): string {
  if (!key) return customAccent || MODULE_TINTS.home;
  const k = key.toLowerCase() as ModuleKey;
  if (k === 'home' && customAccent) return customAccent;
  return MODULE_TINTS[k] || customAccent || MODULE_TINTS.home;
}
