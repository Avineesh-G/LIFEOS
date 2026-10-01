import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeMode } from './useDayPhase';
import {
  getM3ThemeForSection,
  getSectionFromPathname,
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
} from '../theme/sectionSeedColors';
import { getActiveAccent, ThemeAccent } from '../theme/themeColorManager';

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

  const [accent, setAccent] = useState<ThemeAccent>(getActiveAccent);

  useEffect(() => {
    const handleAccentChanged = (e: any) => {
      setAccent(e.detail || getActiveAccent());
    };
    window.addEventListener('lifeos:theme-accent-changed', handleAccentChanged);
    return () => window.removeEventListener('lifeos:theme-accent-changed', handleAccentChanged);
  }, []);

  const section = sectionOverride || getSectionFromPathname(pathname);
  const [themeMode] = useThemeMode();

  const isDark = themeMode === 'night';

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
