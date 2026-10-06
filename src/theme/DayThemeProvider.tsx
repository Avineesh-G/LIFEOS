import React, { createContext, useContext, useEffect } from 'react';
import { useDayPhase, DayPhase } from '../hooks/useDayPhase';
import { useMaterialTheme } from '../hooks/useMaterialTheme';
import {
  SectionM3Theme,
  M3ColorScheme,
  AppSection,
  applyM3ThemeToDocument,
  getM3ThemeForSection,
} from './sectionSeedColors';
import { applyUnifiedThemeToDocument, getActiveAccent } from './themeColorManager';
import { initM3StateLayer } from '../utils/m3StateLayer';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { TEXT_TONAL_DARK, TEXT_TONAL_LIGHT, TYPOGRAPHY_TOKENS } from './typography';
import { applyPerfToDocument } from '../hooks/usePerformanceMode';

const ThemeBridge = registerPlugin<any>('ThemeBridge');

const MODULE_RGB_MAP: Record<string, [number, number, number]> = {
  home: [94, 92, 230],        // Indigo
  gym: [255, 69, 58],         // Coral
  nutrition: [255, 159, 10],   // Orange
  study: [100, 210, 255],     // Cyan
  flow: [100, 210, 255],      // Cyan
  timetable: [10, 132, 255],   // Blue
  tasks: [94, 92, 230],       // Indigo
  spending: [48, 209, 88],    // Green
  finance: [48, 209, 88],     // Green
  shopping: [48, 209, 88],    // Green
  laundry: [100, 210, 255],   // Cyan
  notes: [255, 214, 10],      // Yellow/Gold
  braindump: [255, 214, 10],  // Yellow/Gold
  transcribe: [255, 69, 58],  // Red-orange
  recall: [191, 90, 242],     // Purple
  flashcards: [191, 90, 242], // Purple
  outing: [100, 210, 255],    // Cyan
  settings: [142, 142, 147],  // Slate
  vault: [94, 92, 230],       // Indigo
  history: [172, 142, 104],   // Tan
};

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

    root.style.setProperty('--day-theme-transition', 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)');

    applyM3ThemeToDocument(scheme);
    applyPerfToDocument();
    applyUnifiedThemeToDocument(getActiveAccent(), isDark);

    // ── Precomputed Module Tint Values (Section 3.1) ──
    const [r, g, b] = MODULE_RGB_MAP[section] || [94, 92, 230];
    
    // Ambient light setting: default 'medium' (0.14), 'low' (0.06), 'off' (0)
    let ambientSetting = 'medium';
    try {
      const saved = localStorage.getItem('lifeos_ambient_light');
      if (saved === 'off' || saved === 'low' || saved === 'medium') {
        ambientSetting = saved;
      }
    } catch {}

    const ambientAlpha = ambientSetting === 'off' ? 0 : ambientSetting === 'low' ? 0.06 : 0.14;

    root.style.setProperty('--canvas', '#000000');
    root.style.setProperty('--card-base', '#0E0E10');
    root.style.setProperty('--card-sheen-a', 'rgba(255, 255, 255, 0.085)');
    root.style.setProperty('--card-sheen-b', 'rgba(255, 255, 255, 0.030)');
    root.style.setProperty('--card-sheen-c', 'rgba(255, 255, 255, 0.055)');
    root.style.setProperty('--hl-top', 'rgba(255, 255, 255, 0.09)');
    root.style.setProperty('--hl-bottom', 'rgba(0, 0, 0, 0.60)');
    root.style.setProperty('--card-shadow', '0 20px 36px -22px rgba(0, 0, 0, 0.90)');
    root.style.setProperty('--sep', 'rgba(255, 255, 255, 0.06)');
    root.style.setProperty('--tint-glow', `rgba(${r}, ${g}, ${b}, 0.20)`);
    root.style.setProperty('--tint-glow-hero', `rgba(${r}, ${g}, ${b}, 0.30)`);
    root.style.setProperty('--tint-glow-tile', `rgba(${r}, ${g}, ${b}, 0.10)`);
    root.style.setProperty('--ambient', `rgba(${r}, ${g}, ${b}, ${ambientAlpha})`);
    root.style.setProperty('--tint-fill', `rgba(${r}, ${g}, ${b}, 0.18)`);
    root.style.setProperty('--tint-color', `rgb(${r}, ${g}, ${b})`);

    const tonal = isDark ? TEXT_TONAL_DARK : TEXT_TONAL_LIGHT;
    root.style.setProperty('--text-1', '#FFFFFF');
    root.style.setProperty('--text-2', 'rgba(240, 240, 245, 0.72)');
    root.style.setProperty('--text-3', 'rgba(235, 235, 245, 0.48)');
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

/**
 * Convenient hook to consume current section theme state and tokens.
 */
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
