import React, { createContext, useContext, useEffect } from 'react';
import { useDayPhase, DayPhase } from '../hooks/useDayPhase';
import {
  PIXEL_SKY_PALETTES,
  PhaseUiTokens,
  hexToRgb
} from '../utils/pixelSkyPalettes';
import { getHeadingWeight, getBodyWeight } from './typography';

export interface DayThemeContextValue {
  phase: DayPhase;
  nextPhase: DayPhase;
  progress: number;
  ui: PhaseUiTokens;
  isDark: boolean;
  headingWeight: number;
  bodyWeight: number;
}

const DayThemeContext = createContext<DayThemeContextValue | null>(null);

export function DayThemeProvider({ children }: { children: React.ReactNode }) {
  const { phase, nextPhase, progress } = useDayPhase();
  const phaseConfig = PIXEL_SKY_PALETTES[phase];
  const ui = phaseConfig.ui;
  const isDark = phase === 'night';
  const headingWeight = getHeadingWeight(phase, progress);
  const bodyWeight = getBodyWeight(phase, progress);

  useEffect(() => {
    // Purge legacy manual theme keys from storage on mount
    try {
      localStorage.removeItem('theme');
      localStorage.removeItem('accentColor');
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Apply smooth 400ms transition on color/background properties across :root
    root.style.setProperty('--day-theme-transition', 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)');

    // Surface RGB & Alpha
    const [sR, sG, sB] = hexToRgb(ui.cardSurface);
    const cardSurfaceRgba = `rgba(${sR}, ${sG}, ${sB}, ${ui.cardSurfaceAlpha})`;

    // Single source of truth CSS Custom Properties directly from pixelSkyPalettes
    root.style.setProperty('--card-surface', cardSurfaceRgba);
    root.style.setProperty('--card-surface-hex', ui.cardSurface);
    root.style.setProperty('--card-border', ui.cardBorder);
    root.style.setProperty('--text-primary', ui.textPrimary);
    root.style.setProperty('--text-secondary', ui.textSecondary);
    root.style.setProperty('--text-muted', ui.textMuted);
    root.style.setProperty('--accent', ui.accent);
    root.style.setProperty('--accent-primary', ui.accent);
    root.style.setProperty('--accent-secondary', ui.accent);
    root.style.setProperty('--accent-contrast', ui.accentContrast);
    root.style.setProperty('--accent-soft', ui.accentSoft);
    root.style.setProperty('--pill-active-bg', ui.accentSoft);
    root.style.setProperty('--pill-active-text', ui.accent);

    // Compatibility aliases for Tailwind and design system
    root.style.setProperty('--bg-card', cardSurfaceRgba);
    root.style.setProperty('--bg-card-elevated', cardSurfaceRgba);
    root.style.setProperty('--border-card', ui.cardBorder);
    root.style.setProperty('--glow', 'transparent');
    root.style.setProperty('--shadow-glow', 'transparent');
    root.style.setProperty('--shadow-card', isDark ? '0 4px 16px rgba(0, 0, 0, 0.30)' : '0 4px 16px rgba(0, 0, 0, 0.04)');
    root.style.setProperty('--headline-gradient', `linear-gradient(to right, ${ui.textPrimary}, ${ui.accent})`);

    // Pixel unit scale aligned to background grid (12px default, snaps padding/texture)
    root.style.setProperty('--pixel-size', '12px');
    root.style.setProperty('--pixel-unit', '12px');

    // Apply day-phase aware typography weight custom properties
    root.style.setProperty('--font-weight-heading', headingWeight.toString());
    root.style.setProperty('--font-weight-body', bodyWeight.toString());

    // Compute --accent-rgb for Tailwind opacity utilities (e.g., bg-accent/15)
    const [aR, aG, aB] = hexToRgb(ui.accent);
    root.style.setProperty('--accent-rgb', `${aR}, ${aG}, ${aB}`);

    // Set data attribute for phase-aware CSS styling
    root.dataset.dayPhase = phase;

    // Toggle .dark class exclusively at night for Tailwind dark:* utilities
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Sync mobile browser status bar / navigation bar meta tags
    const metaThemeTags = document.querySelectorAll('meta[name="theme-color"]');
    metaThemeTags.forEach(tag => {
      tag.setAttribute('content', ui.cardSurface);
    });
  }, [phase, ui, isDark, headingWeight, bodyWeight]);

  return (
    <DayThemeContext.Provider value={{ phase, nextPhase, progress, ui, isDark, headingWeight, bodyWeight }}>
      {children}
    </DayThemeContext.Provider>
  );
}

/**
 * Convenient hook to consume the current day theme state and pixel-native UI tokens.
 */
export function useDayTheme(): DayThemeContextValue {
  const context = useContext(DayThemeContext);
  if (!context) {
    const phaseInfo = useDayPhase();
    const ui = PIXEL_SKY_PALETTES[phaseInfo.phase].ui;
    return {
      ...phaseInfo,
      ui,
      isDark: phaseInfo.phase === 'night',
      headingWeight: getHeadingWeight(phaseInfo.phase, phaseInfo.progress),
      bodyWeight: getBodyWeight(phaseInfo.phase, phaseInfo.progress),
    };
  }
  return context;
}
