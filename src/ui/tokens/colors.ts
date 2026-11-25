/**
 * LifeOS "iOS Liquid Glass" + Unified M3 Single-Color Tokens
 * All module keys resolve cleanly to the active unified M3 theme accent so
 * every page follows one cohesive color with light ambient gradient finishes.
 */
import { getActiveAccent } from '../../theme/themeColorManager';

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
  surface1: '#141416',
  surface2: '#1C1C20',
  surface3: '#26262C',
  separator: 'rgba(255, 255, 255, 0.08)',
  text1: '#FFFFFF',
  text2: 'rgba(242, 242, 247, 0.78)',
  text3: 'rgba(235, 235, 245, 0.56)',
  fillGlass: 'rgba(28, 28, 34, 0.78)',
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
  | 'luna'
  | 'calendar'
  | 'drive';

const UNIFIED_VAR = 'var(--app-accent-text, var(--app-accent, #8B1E3F))';

export const MODULE_TINTS: Record<ModuleKey, string> = {
  home: UNIFIED_VAR,
  calendar: UNIFIED_VAR,
  gym: UNIFIED_VAR,
  nutrition: UNIFIED_VAR,
  study: UNIFIED_VAR,
  flow: UNIFIED_VAR,
  timetable: UNIFIED_VAR,
  spending: UNIFIED_VAR,
  outing: UNIFIED_VAR,
  shopping: UNIFIED_VAR,
  tasks: UNIFIED_VAR,
  laundry: UNIFIED_VAR,
  notes: UNIFIED_VAR,
  flashcards: UNIFIED_VAR,
  braindump: UNIFIED_VAR,
  transcriber: UNIFIED_VAR,
  vault: UNIFIED_VAR,
  history: UNIFIED_VAR,
  streak: UNIFIED_VAR,
  luna: UNIFIED_VAR,
  drive: UNIFIED_VAR,
};

export const LUNA_GRADIENT = ['var(--app-accent, #8B1E3F)', 'var(--app-accent-end, #B52B4D)'];

export function getModuleTint(_key?: string | null, customAccent?: string): string {
  if (customAccent) return customAccent;
  const active = getActiveAccent();
  return active.tertiary || active.secondary || active.primary || '#8B1E3F';
}
