import React, { createContext, useContext, useEffect } from 'react';
import { useDayPhase, DayPhase } from '../hooks/useDayPhase';
import { useMaterialTheme } from '../hooks/useMaterialTheme';
import {
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
  applyM3ThemeToDocument,
  getM3ThemeForSection,
  hexToRgb,
} from './sectionSeedColors';
import { applyUnifiedThemeToDocument, getActiveAccent } from './themeColorManager';
import { initM3StateLayer } from '../utils/m3StateLayer';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { TEXT_TONAL_DARK, TEXT_TONAL_LIGHT, TYPOGRAPHY_TOKENS } from './typography';
import { applyPerfToDocument } from '../hooks/usePerformanceMode';

const ThemeBridge = registerPlugin<any>('ThemeBridge');

export interface DayThemeContextValue {
  phase: DayPhase;
  nextPhase: DayPhase;
  progress: number;
  section: AppSection;
  m3Theme: SectionM3Theme;
  scheme: M3ColorScheme;
  isDark: boolean;
  headingWeight: number;
  bodyWeight: number;
}

const DayThemeContext = createContext<DayThemeContextValue | null>(null);

export function DayThemeProvider({ children }: { children: React.ReactNode }) {
  const { phase, nextPhase, progress } = useDayPhase();
  const { theme: m3Theme, scheme, isDark, section } = useMaterialTheme();

  const headingWeight = 600;
  const bodyWeight = 400;

  useEffect(() => {
    initM3StateLayer();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--day-theme-transition', 'opacity 250ms cubic-bezier(0.16, 1, 0.3, 1)');

    applyM3ThemeToDocument(scheme);
    applyPerfToDocument();
    applyUnifiedThemeToDocument(getActiveAccent(), isDark);

    // Single unified theme accent RGB (light & ambient only)
    const [r, g, b] = hexToRgb(scheme.moduleAccent);
    const [sr, sg, sb] = hexToRgb(scheme.moduleSecondary);

    // Light ambient setting: default 'medium' (0.08), 'low' (0.045), 'off' (0)
    let ambientSetting = 'medium';
    try {
      const saved = localStorage.getItem('lifeos_ambient_light');
      if (saved === 'off' || saved === 'low' || saved === 'medium') {
        ambientSetting = saved;
      }
    } catch {}

    const ambientAlpha = ambientSetting === 'off' ? 0 : ambientSetting === 'low' ? 0.045 : 0.085;

    root.style.setProperty('--canvas', '#000000');
    root.style.setProperty('--card-base', '#141416');
    root.style.setProperty('--card-main', '#141416');
    root.style.setProperty('--card-hero', '#161618');
    root.style.setProperty('--card-sheen-a', 'rgba(255, 255, 255, 0.095)');
    root.style.setProperty('--card-sheen-b', 'rgba(255, 255, 255, 0.025)');
    root.style.setProperty('--card-sheen-c', `rgba(${r}, ${g}, ${b}, 0.045)`);
    root.style.setProperty('--hl-top', 'rgba(255, 255, 255, 0.11)');
    root.style.setProperty('--hl-bottom', 'rgba(0, 0, 0, 0.60)');
    root.style.setProperty('--card-shadow', '0 20px 36px -22px rgba(0, 0, 0, 0.90)');
    root.style.setProperty('--sep', 'rgba(255, 255, 255, 0.06)');
    root.style.setProperty('--tint-glow', `rgba(${sr}, ${sg}, ${sb}, 0.075)`);
    root.style.setProperty('--tint-glow-hero', `rgba(${sr}, ${sg}, ${sb}, 0.11)`);
    root.style.setProperty('--tint-glow-tile', `rgba(${sr}, ${sg}, ${sb}, 0.055)`);
    root.style.setProperty('--ambient', `rgba(${sr}, ${sg}, ${sb}, ${ambientAlpha})`);
    root.style.setProperty('--ambient-secondary', `rgba(${r}, ${g}, ${b}, ${Math.max(0, ambientAlpha - 0.02)})`);
    root.style.setProperty('--tint-fill', `rgba(${sr}, ${sg}, ${sb}, 0.14)`);
    root.style.setProperty('--tint-color', `rgb(${r}, ${g}, ${b})`);

    const tonal = isDark ? TEXT_TONAL_DARK : TEXT_TONAL_LIGHT;
    root.style.setProperty('--text-1', '#FFFFFF');
    root.style.setProperty('--text-2', 'rgba(242, 242, 247, 0.78)');
    root.style.setProperty('--text-3', 'rgba(235, 235, 245, 0.56)');
    root.style.setProperty('--text-primary', tonal.primary);
    root.style.setProperty('--text-secondary', tonal.secondary);
    root.style.setProperty('--text-tertiary', tonal.tertiary);
    root.style.setProperty('--text-disabled', tonal.disabled);
    root.style.setProperty('--text-muted', tonal.tertiary);

    root.style.setProperty('--font-family-primary', TYPOGRAPHY_TOKENS.fontFamilyPrimary);
    root.style.setProperty('--font-primary', 'var(--font-family-primary)');
    root.style.setProperty('--font-weight-regular', TYPOGRAPHY_TOKENS.fontWeightRegular.toString());
    root.style.setProperty('--font-weight-medium', TYPOGRAPHY_TOKENS.fontWeightMedium.toString());
    root.style.setProperty('--font-weight-semibold', TYPOGRAPHY_TOKENS.fontWeightSemiBold.toString());
    root.style.setProperty('--font-weight-bold', TYPOGRAPHY_TOKENS.fontWeightBold.toString());
    root.style.setProperty('--font-weight-heading', headingWeight.toString());
    root.style.setProperty('--font-weight-body', bodyWeight.toString());

    root.dataset.section = section;
    root.dataset.dayPhase = phase;

    root.style.backgroundColor = '#000000';
    root.style.color = '#FFFFFF';
    if (document.body) {
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#FFFFFF';
    }

    root.classList.add('dark');

    const metaThemeTags = document.querySelectorAll('meta[name="theme-color"]');
    metaThemeTags.forEach(tag => {
      tag.setAttribute('content', '#000000');
    });

    if (Capacitor.isNativePlatform()) {
      ThemeBridge.setSystemBarsTheme({ isDark: true, sceneBg: '#000000' }).catch(() => {});
    }
  }, [section, m3Theme, scheme, isDark, phase]);

  return (
    <DayThemeContext.Provider
      value={{
        phase,
        nextPhase,
        progress,
        section,
        m3Theme,
        scheme,
        isDark,
        headingWeight,
        bodyWeight,
      }}
    >
      {children}
    </DayThemeContext.Provider>
  );
}

export function useDayTheme(): DayThemeContextValue {
  const context = useContext(DayThemeContext);
  if (!context) {
    const phaseInfo = useDayPhase();
    const isDark = true;
    const m3Theme = getM3ThemeForSection('home', isDark);
    return {
      ...phaseInfo,
      section: 'home',
      m3Theme,
      scheme: m3Theme.scheme,
      isDark,
      headingWeight: 600,
      bodyWeight: 400,
    };
  }
  return context;
}
