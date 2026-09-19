import React, { createContext, useContext, useEffect } from 'react';
import { useDayPhase, DayPhase } from '../hooks/useDayPhase';
import { useMaterialTheme, UseMaterialThemeReturn } from '../hooks/useMaterialTheme';
import {
  SectionM3Theme,
  M3ColorScheme,
  hexToRgb,
  AppSection,
  getM3ThemeForSection,
  applyM3ThemeToDocument,
} from './sectionSeedColors';
import { initM3StateLayer } from '../utils/m3StateLayer';
import { TEXT_TONAL_DARK, TEXT_TONAL_LIGHT, TYPOGRAPHY_TOKENS } from './typography';

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

  // Pixel typography weight hierarchy: 600 heading, 400 body (700 rare display emphasis)
  const headingWeight = 600;
  const bodyWeight = 400;

  useEffect(() => {
    // Initialize native Material 3 state-layer touch ripple
    initM3StateLayer();

    // Purge legacy manual theme keys from storage on mount
    try {
      localStorage.removeItem('theme');
      localStorage.removeItem('accentColor');
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Apply smooth transition on background scenes
    root.style.setProperty('--day-theme-transition', 'all 500ms cubic-bezier(0.2, 0, 0, 1)');

    applyM3ThemeToDocument(scheme);

    // ── UI Bridge for Full Dynamic Backward Compatibility ──
    const cardBg = isDark ? scheme.surfaceContainerLow : scheme.surfaceContainerLowest;
    const cardElevated = isDark ? scheme.surfaceContainer : scheme.surfaceContainerLow;

    // ── Pixel 4-Level Tonal Text Hierarchy ──
    const tonal = isDark ? TEXT_TONAL_DARK : TEXT_TONAL_LIGHT;
    root.style.setProperty('--text-primary', tonal.primary);
    root.style.setProperty('--text-secondary', tonal.secondary);
    root.style.setProperty('--text-tertiary', tonal.tertiary);
    root.style.setProperty('--text-disabled', tonal.disabled);
    root.style.setProperty('--text-muted', tonal.tertiary);

    // ── Pixel Core Typography Tokens ──
    root.style.setProperty('--font-family-primary', TYPOGRAPHY_TOKENS.fontFamilyPrimary);
    root.style.setProperty('--font-primary', 'var(--font-family-primary)');
    root.style.setProperty('--font-weight-regular', TYPOGRAPHY_TOKENS.fontWeightRegular.toString());
    root.style.setProperty('--font-weight-medium', TYPOGRAPHY_TOKENS.fontWeightMedium.toString());
    root.style.setProperty('--font-weight-semibold', TYPOGRAPHY_TOKENS.fontWeightSemiBold.toString());
    root.style.setProperty('--font-weight-bold', TYPOGRAPHY_TOKENS.fontWeightBold.toString());
    root.style.setProperty('--font-weight-heading', headingWeight.toString());
    root.style.setProperty('--font-weight-body', bodyWeight.toString());

    root.style.setProperty('--card-surface', cardBg);
    root.style.setProperty('--card-surface-hex', cardBg);
    root.style.setProperty('--card-border', scheme.outlineVariant);
    root.style.setProperty('--accent', scheme.primary);
    root.style.setProperty('--accent-primary', scheme.primary);
    root.style.setProperty('--accent-secondary', scheme.secondary);
    root.style.setProperty('--accent-contrast', scheme.onPrimary);
    root.style.setProperty('--accent-soft', scheme.primaryContainer);
    root.style.setProperty('--pill-active-bg', scheme.primaryContainer);
    root.style.setProperty('--pill-active-text', scheme.onPrimaryContainer);

    root.style.setProperty('--bg-card', cardBg);
    root.style.setProperty('--bg-card-elevated', cardElevated);
    root.style.setProperty('--border-card', scheme.outlineVariant);
    root.style.setProperty('--glow', 'transparent');
    root.style.setProperty('--shadow-glow', 'transparent');
    // M3 tonal elevation replaces harsh drop shadows
    root.style.setProperty('--shadow-card', 'none');
    root.style.setProperty('--headline-gradient', `linear-gradient(to right, ${tonal.primary}, ${scheme.primary})`);

    // RGB channels for opacity utilities
    const [aR, aG, aB] = hexToRgb(scheme.primary);
    root.style.setProperty('--accent-rgb', `${aR}, ${aG}, ${aB}`);
    root.style.setProperty('--primary-rgb', `${aR}, ${aG}, ${aB}`);
    root.style.setProperty('--md-primary-rgb', `${aR}, ${aG}, ${aB}`);

    const [sR, sG, sB] = hexToRgb(scheme.surface);
    root.style.setProperty('--surface-rgb', `${sR}, ${sG}, ${sB}`);

    const [scR, scG, scB] = hexToRgb(scheme.sceneBg);
    root.style.setProperty('--scene-bg-rgb', `${scR}, ${scG}, ${scB}`);

    // Section dataset for CSS targeting
    root.dataset.section = section;
    root.dataset.dayPhase = phase;

    // Full bleed background
    root.style.backgroundColor = scheme.sceneBg;
    root.style.color = tonal.primary;
    if (document.body) {
      document.body.style.backgroundColor = scheme.sceneBg;
      document.body.style.color = tonal.primary;
    }

    // Dark class for Tailwind dark:* utilities
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Mobile theme-color meta tag matches saturated scene
    const metaThemeTags = document.querySelectorAll('meta[name="theme-color"]');
    metaThemeTags.forEach(tag => {
      tag.setAttribute('content', scheme.sceneBg);
    });
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

/**
 * Convenient hook to consume the current section theme state and M3 tokens.
 */
export function useDayTheme(): DayThemeContextValue {
  const context = useContext(DayThemeContext);
  if (!context) {
    const phaseInfo = useDayPhase();
    const isDark = false;
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
