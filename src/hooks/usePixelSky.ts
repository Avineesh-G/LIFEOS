import { useState, useEffect, useMemo } from 'react';
import {
  PixelSkyPhaseConfig,
  PIXEL_SKY_PALETTES,
} from '../utils/pixelSkyPalettes';
import { useDayPhase, DayPhase } from './useDayPhase';

export type PerformanceTier = 'high' | 'mid' | 'low';

export interface PixelSkyState {
  phase: DayPhase;
  nextPhase: DayPhase;
  progress: number; // 0 to 1 through current phase
  palette: PixelSkyPhaseConfig;
  nextPalette: PixelSkyPhaseConfig;
  pixelSizePx: number;
  gridCols: number;
  gridRows: number;
  performanceTier: PerformanceTier;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Lightweight one-time hardware heuristic to determine optimal pixel size
 */
function detectPerformanceTier(): { tier: PerformanceTier; pixelSizePx: number } {
  if (typeof window === 'undefined') {
    return { tier: 'mid', pixelSizePx: 14 };
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // High tier: Strong desktop/laptop or high-end mobile (>= 8 cores or >= 6GB RAM)
  if (cores >= 8 && memory >= 6) {
    return { tier: 'high', pixelSizePx: 9 };
  }
  if (cores >= 6 && !isMobile) {
    return { tier: 'high', pixelSizePx: 10 };
  }
  // Low tier: restricted hardware
  if (cores <= 2 || memory <= 2) {
    return { tier: 'low', pixelSizePx: 22 };
  }
  // Mid tier: standard phone or laptop
  return { tier: 'mid', pixelSizePx: isMobile ? 15 : 14 };
}

/**
 * Flow controller hook for LifeOS Ambient Pixel-Sky.
 * Consumes useDayPhase() for shared time/phase state and handles canvas-specific sizing and palette mapping.
 */
export function usePixelSky(): PixelSkyState {
  const { phase, nextPhase, progress } = useDayPhase();
  const [{ tier, pixelSizePx }] = useState(() => detectPerformanceTier());
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));

  // Handle window resize and orientation changes with a smooth debounce
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let resizeTimer: any = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const gridCols = useMemo(() => {
    return Math.max(1, Math.ceil(dimensions.width / pixelSizePx));
  }, [dimensions.width, pixelSizePx]);

  const gridRows = useMemo(() => {
    return Math.max(1, Math.ceil(dimensions.height / pixelSizePx));
  }, [dimensions.height, pixelSizePx]);

  const palette = PIXEL_SKY_PALETTES[phase];
  const nextPalette = PIXEL_SKY_PALETTES[nextPhase];

  return {
    phase,
    nextPhase,
    progress,
    palette,
    nextPalette,
    pixelSizePx,
    gridCols,
    gridRows,
    performanceTier: tier,
    viewportWidth: dimensions.width,
    viewportHeight: dimensions.height,
  };
}
