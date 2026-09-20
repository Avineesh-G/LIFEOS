import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeMode } from './useDayPhase';
import {
  getM3ThemeForSection,
  getSectionFromPathname,
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
} from '../theme/sectionSeedColors';

export interface UseMaterialThemeReturn {
  theme: SectionM3Theme;
  scheme: M3ColorScheme;
  isDark: boolean;
  section: AppSection;
  seedHex: string;
  // Backwards compatibility alias
  phase: string;
}

/**
 * Reactive hook that generates the full Material 3 Expressive role set
 * from the active route section seed color and Light/Dark scheme mode,
 * and synchronizes all CSS variables onto document.documentElement.
 */
export function useMaterialTheme(sectionOverride?: AppSection): UseMaterialThemeReturn {
  let pathname = '/';
  try {
    const location = useLocation();
    pathname = location.pathname;
  } catch {
    if (typeof window !== 'undefined') {
      pathname = window.location.pathname;
    }
  }

  const section = sectionOverride || getSectionFromPathname(pathname);
  const [themeMode] = useThemeMode();

  const isNightLocked = themeMode === 'night';
  const isDark = isNightLocked;

  const theme = useMemo(() => {
    return getM3ThemeForSection(section, isDark);
  }, [section, isDark]);


  return {
    theme,
    scheme: theme.scheme,
    isDark,
    section,
    seedHex: theme.seedHex,
    phase: section,
  };
}

export default useMaterialTheme;
