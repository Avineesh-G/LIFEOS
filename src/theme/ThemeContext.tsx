import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeConfig,
  ThemeMode,
  getActiveTheme,
  saveAndApplyTheme,
  resetThemeToDefault,
  subscribeTheme,
  isDarkModeActive,
  applyThemeToDom,
} from './themeStore';
import { PALETTES, getPaletteById, PaletteDefinition } from './palettes';
import { getSchemeForPalette, M3ColorScheme } from './colorEngine';

interface ThemeContextType {
  theme: ThemeConfig;
  activePalette: PaletteDefinition;
  scheme: M3ColorScheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setPaletteId: (id: string) => void;
  applyTheme: (config: ThemeConfig) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    const active = getActiveTheme();
    applyThemeToDom(active);
    return active;
  });

  const isDark = useMemo(() => isDarkModeActive(theme.mode), [theme.mode]);
  const activePalette = useMemo(() => getPaletteById(theme.paletteId), [theme.paletteId]);
  const scheme = useMemo(() => getSchemeForPalette(theme.paletteId, isDark), [theme.paletteId, isDark]);

  useEffect(() => {
    // Initial DOM write
    applyThemeToDom(theme);

    const unsubscribe = subscribeTheme((newTheme) => {
      setThemeState(newTheme);
    });

    return unsubscribe;
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    const updated = { ...theme, mode };
    saveAndApplyTheme(updated);
  }, [theme]);

  const setPaletteId = useCallback((paletteId: string) => {
    const updated = { ...theme, paletteId };
    saveAndApplyTheme(updated);
  }, [theme]);

  const applyTheme = useCallback((config: ThemeConfig) => {
    saveAndApplyTheme(config);
  }, []);

  const resetToDefault = useCallback(() => {
    resetThemeToDefault();
  }, []);

  const value = useMemo(
    () => ({
      theme,
      activePalette,
      scheme,
      isDark,
      setThemeMode,
      setPaletteId,
      applyTheme,
      resetToDefault,
    }),
    [theme, activePalette, scheme, isDark, setThemeMode, setPaletteId, applyTheme, resetToDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useM3Theme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useM3Theme must be used within a ThemeProvider');
  }
  return ctx;
}
