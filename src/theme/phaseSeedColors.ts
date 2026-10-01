export * from './sectionSeedColors.ts';
import { getM3ThemeForSection, type SectionM3Theme, type AppSection } from './sectionSeedColors.ts';
import type { DayPhase } from '../hooks/useDayPhase.ts';

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

