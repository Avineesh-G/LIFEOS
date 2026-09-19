/**
 * LifeOS — Material 3 Expressive Phase & Section Theme Compatibility Layer
 * 
 * Re-exports section-based M3 Expressive engine and preserves backwards compatibility.
 */

export * from './sectionSeedColors.ts';
import {
  SECTION_SEED_COLORS,
  getM3ThemeForSection,
  getSectionFromPathname,
} from './sectionSeedColors.ts';
import type {
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
} from './sectionSeedColors.ts';
import type { DayPhase } from '../hooks/useDayPhase.ts';

/**
 * Backwards compatibility mapping from DayPhase to AppSection
 */
export const PHASE_SEED_COLORS: Record<string, string> = {
  dawn: SECTION_SEED_COLORS.nutrition,
  morning: SECTION_SEED_COLORS.study,
  afternoon: SECTION_SEED_COLORS.home,
  dusk: SECTION_SEED_COLORS.gym,
  evening: SECTION_SEED_COLORS.finance,
  night: SECTION_SEED_COLORS.settings,
};

export type PhaseM3Theme = SectionM3Theme;

export function getM3ThemeForPhase(phase: DayPhase | string, isDark: boolean): SectionM3Theme {
  const phaseToSection: Record<string, AppSection> = {
    dawn: 'nutrition',
    morning: 'study',
    afternoon: 'home',
    dusk: 'gym',
    evening: 'finance',
    night: 'settings',
  };
  const section = phaseToSection[phase] || 'home';
  return getM3ThemeForSection(section, isDark);
}
