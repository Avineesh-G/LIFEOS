import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getM3ThemeForSection,
  getSectionFromPathname,
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
} from '../theme/sectionSeedColors';
import { ThemeAccent } from '../theme/themeColorManager';
import { useM3Theme } from '../theme/ThemeContext';

export interface UseMaterialThemeReturn {
  theme: SectionM3Theme;
  scheme: M3ColorScheme;
  isDark: boolean;
  section: AppSection;
  seedHex: string;
  accent: ThemeAccent;
  phase: string;
}

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

  const { isDark, activePalette } = useM3Theme();
  const section = sectionOverride || getSectionFromPathname(pathname);

  const accent: ThemeAccent = useMemo(() => ({
    id: activePalette.id,
    name: activePalette.name,
    primary: activePalette.seed,
    secondary: activePalette.seed,
    darkText: '#5A0015',
  }), [activePalette]);

  const theme = useMemo(() => {
    return getM3ThemeForSection(section, isDark, accent);
  }, [section, isDark, accent]);

  return {
    theme,
    scheme: theme.scheme,
    isDark,
    section,
    seedHex: theme.seedHex,
    accent,
    phase: section,
  };
}

export default useMaterialTheme;

