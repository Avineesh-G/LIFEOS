import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeMode } from './useDayPhase';
import {
  getM3ThemeForSection,
  getSectionFromPathname,
  getRoutePersonalizedColorFamily,
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
} from '../theme/sectionSeedColors';
import { ColorFamily } from '../theme/colorFamilies';

export interface UseMaterialThemeReturn {
  theme: SectionM3Theme;
  scheme: M3ColorScheme;
  isDark: boolean;
  section: AppSection;
  seedHex: string;
  colorFamily: ColorFamily;
  // Backwards compatibility alias
  phase: string;
}

/**
 * Reactive hook that generates the full Material 3 Expressive role set
 * from the active route section seed color, personalized interface color family,
 * and Light/Dark scheme mode, and synchronizes all CSS variables onto document.documentElement.
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

  const [colorVersion, setColorVersion] = useState(0);

  useEffect(() => {
    const handleColorsChanged = () => {
      setColorVersion((v) => v + 1);
    };
    window.addEventListener('lifeos:interface-colors-changed', handleColorsChanged);
    return () => window.removeEventListener('lifeos:interface-colors-changed', handleColorsChanged);
  }, []);

  const section = sectionOverride || getSectionFromPathname(pathname);
  const [themeMode] = useThemeMode();

  const isNightLocked = themeMode === 'night';
  const isDark = isNightLocked;

  const colorFamily = useMemo(() => {
    return getRoutePersonalizedColorFamily(pathname);
  }, [pathname, colorVersion]);

  const theme = useMemo(() => {
    return getM3ThemeForSection(section, isDark, colorFamily);
  }, [section, isDark, colorFamily]);

  return {
    theme,
    scheme: theme.scheme,
    isDark,
    section,
    seedHex: theme.seedHex,
    colorFamily,
    phase: section,
  };
}

export default useMaterialTheme;
