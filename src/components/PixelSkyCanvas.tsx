import React, { useEffect, useRef, useState } from 'react';
import { usePixelSky } from '../hooks/usePixelSky';
import { DayPhase } from '../utils/pixelSkyPalettes';

interface PixelSkyCanvasProps {
  /** Optional theme override if caller provides it directly */
  theme?: 'light' | 'dark' | 'system';
  /** Optional custom class names */
  className?: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Parses hex string (#RGB or #RRGGBB) to numeric RGB */
function parseHex(hex: string): RgbColor {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/** Linearly interpolates between two RGB colors */
function lerpRgb(c1: RgbColor, c2: RgbColor, t: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * clamped),
    g: Math.round(c1.g + (c2.g - c1.g) * clamped),
    b: Math.round(c1.b + (c2.b - c1.b) * clamped),
  };
}

/** Samples a color from a multi-stop color array based on position 0-1 */
function sampleGradient(colors: RgbColor[], pos: number): RgbColor {
  if (colors.length === 0) return { r: 10, g: 12, b: 20 };
  if (colors.length === 1) return colors[0];

  const p = Math.max(0, Math.min(1, pos));
  const segmentLength = 1 / (colors.length - 1);
  const index = Math.min(Math.floor(p / segmentLength), colors.length - 2);
  const segmentT = (p - index * segmentLength) / segmentLength;

  return lerpRgb(colors[index], colors[index + 1], segmentT);
}

/** Lightweight fast integer hash for deterministic per-cell pseudo-noise */
function cellHash(x: number, y: number, seed: number = 42): number {
  let h = (x * 374761393 + y * 668265263 + seed) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export default function PixelSkyCanvas({ theme, className = '' }: PixelSkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasContextError, setHasContextError] = useState(false);

  const {
    phase,
    progress,
    palette,
    nextPalette,
    pixelSizePx,
    gridCols,
    gridRows,
    viewportWidth,
    viewportHeight,
  } = usePixelSky();

  // Reference storage for Tier 2 shimmer layer to avoid reallocating
  const baseGridRef = useRef<RgbColor[][]>([]);
  const starsRef = useRef<{ col: number; row: number; baseBrightness: number }[]>([]);
  const lastStarGenRef = useRef<number>(0);

  // Determine dark mode state from document root class (set by useTheme) or explicit prop
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Synchronize CSS custom property with live canvas pixel size
  useEffect(() => {
    if (typeof document !== 'undefined' && pixelSizePx) {
      document.documentElement.style.setProperty('--pixel-size', `${pixelSizePx}px`);
      document.documentElement.style.setProperty('--pixel-unit', `${pixelSizePx}px`);
    }
  }, [pixelSizePx]);

  // ─────────────────────────────────────────────────────────────
  // Tier 1: Full Grid Redraw (Time-tick every 30s & Resize events)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      setHasContextError(true);
      return;
    }

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const renderWidth = viewportWidth;
    const renderHeight = viewportHeight;

    if (canvas.width !== renderWidth * dpr || canvas.height !== renderHeight * dpr) {
      canvas.width = renderWidth * dpr;
      canvas.height = renderHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Parse current and next palette color stops
    const currentRgbStops = palette.colors.map(parseHex);
    const nextRgbStops = nextPalette.colors.map(parseHex);

    // Blend stops between current and next palette based on phase progress for seamless transitions
    const blendedStops = currentRgbStops.map((stop, i) => {
      const nextStop = nextRgbStops[i % nextRgbStops.length];
      return lerpRgb(stop, nextStop, progress * 0.85);
    });

    const maxBrightness = isDarkMode ? palette.darkModeMaxBrightness : palette.lightModeMaxBrightness;
    const isNight = phase === 'night';
    const isDawn = phase === 'dawn';
    const isMorning = phase === 'morning';
    const isDusk = phase === 'dusk';

    // Clear background canvas with base atmospheric ambient wash
    const ambientBase: RgbColor = isDarkMode
      ? { r: 8, g: 10, b: 16 }
      : { r: 242, g: 245, b: 251 };
    ctx.fillStyle = `rgb(${ambientBase.r}, ${ambientBase.g}, ${ambientBase.b})`;
    ctx.fillRect(0, 0, renderWidth, renderHeight);

    // Initialize/resize cached grid
    const newGrid: RgbColor[][] = [];

    // Draw all Minecraft-scale pixel blocks
    for (let col = 0; col < gridCols; col++) {
      newGrid[col] = [];
      const normX = gridCols > 1 ? col / (gridCols - 1) : 0;

      for (let row = 0; row < gridRows; row++) {
        // Bottom-left origin normalized distance:
        // normY: 0 at bottom, 1 at top
        const normY = gridRows > 1 ? (gridRows - 1 - row) / (gridRows - 1) : 0;
        const cornerDist = Math.sqrt(normX * normX + normY * normY) / Math.SQRT2; // 0 to 1
        const noise = cellHash(col, row, 101);

        // Compute phase-specific fill and gradient positioning
        let colorPosition = cornerDist;
        let cellBrightness = maxBrightness;

        if (isDawn) {
          // Soft warm glow rising from bottom-left
          const dawnFrontier = progress * 1.15;
          const insideGlow = cornerDist <= dawnFrontier + (noise - 0.5) * 0.22;
          if (insideGlow) {
            colorPosition = cornerDist / Math.max(0.1, dawnFrontier);
            cellBrightness = maxBrightness * (0.85 + noise * 0.25);
          } else {
            colorPosition = 0.05 + noise * 0.08;
            cellBrightness = maxBrightness * 0.35;
          }
        } else if (isMorning) {
          // Warm light radiates outward, sweeping across the sky in stages
          const sweepFrontier = progress * 1.35;
          const isSunlit = cornerDist <= sweepFrontier + (noise - 0.5) * 0.18;
          if (isSunlit) {
            colorPosition = Math.min(1, cornerDist * 1.1);
            cellBrightness = maxBrightness * (0.9 + noise * 0.2);
          } else {
            colorPosition = 0.2 + cornerDist * 0.3;
            cellBrightness = maxBrightness * 0.55;
          }
        } else if (isDusk) {
          // Fill recedes towards bottom-left, palette sweeps warm to cool
          const duskFrontier = (1 - progress) * 1.25;
          const isWarmHorizon = cornerDist <= duskFrontier + (noise - 0.5) * 0.2;
          if (isWarmHorizon) {
            colorPosition = 1 - cornerDist / Math.max(0.1, duskFrontier);
            cellBrightness = maxBrightness * (0.8 + noise * 0.25);
          } else {
            colorPosition = 0.15 + (1 - cornerDist) * 0.25;
            cellBrightness = maxBrightness * 0.45;
          }
        } else if (isNight) {
          // Deep celestial grid with soft atmospheric depth
          colorPosition = normY * 0.7 + (noise - 0.5) * 0.15;
          cellBrightness = maxBrightness * (0.35 + noise * 0.25);
        } else {
          // Afternoon & Evening: full steady gradient
          colorPosition = (cornerDist * 0.6 + normY * 0.4) + (noise - 0.5) * 0.12;
          cellBrightness = maxBrightness * (0.85 + noise * 0.2);
        }

        const sampled = sampleGradient(blendedStops, colorPosition);

        // Apply theme brightness scaling and subtle contrast curve
        const finalColor = lerpRgb(ambientBase, sampled, Math.max(0.04, Math.min(1, cellBrightness)));
        newGrid[col][row] = finalColor;

        ctx.fillStyle = `rgb(${finalColor.r}, ${finalColor.g}, ${finalColor.b})`;
        ctx.fillRect(
          col * pixelSizePx,
          row * pixelSizePx,
          pixelSizePx - 0.3, // Micro-separation for blocky pixel texture
          pixelSizePx - 0.3
        );
      }
    }

    baseGridRef.current = newGrid;
    ctx.restore();

    // Night: Generate or refresh star locations occasionally (every 3 minutes)
    const nowMs = Date.now();
    if (isNight) {
      if (starsRef.current.length === 0 || nowMs - lastStarGenRef.current > 180000) {
        const starCandidates: { col: number; row: number; baseBrightness: number }[] = [];
        const totalPixels = gridCols * gridRows;
        // ~2.5% star density
        const targetStars = Math.max(8, Math.floor(totalPixels * 0.025));

        for (let i = 0; i < targetStars; i++) {
          const c = Math.floor(cellHash(i, 77, 888) * gridCols);
          const r = Math.floor(cellHash(i, 99, 999) * (gridRows * 0.85)); // Most stars in upper 85% sky
          starCandidates.push({
            col: c,
            row: r,
            baseBrightness: 0.65 + cellHash(c, r, 555) * 0.35,
          });
        }
        starsRef.current = starCandidates;
        lastStarGenRef.current = nowMs;
      }
    } else {
      starsRef.current = [];
    }
  }, [
    phase,
    progress,
    palette,
    nextPalette,
    pixelSizePx,
    gridCols,
    gridRows,
    viewportWidth,
    viewportHeight,
    isDarkMode,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Tier 2: Shimmer & Twinkle Layer (requestAnimationFrame at ~8-10fps)
  // Touches ONLY ~3-5% of pixels, never redraws full grid!
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasContextError) return;

    let animId: number;
    let lastTickTime = 0;
    const TICK_INTERVAL_MS = 115; // ~8.7 frames per second (very low CPU usage)

    const shimmerLoop = (timestamp: number) => {
      animId = requestAnimationFrame(shimmerLoop);

      if (timestamp - lastTickTime < TICK_INTERVAL_MS) {
        return;
      }
      lastTickTime = timestamp;

      const ctx = canvas.getContext('2d');
      if (!ctx || !baseGridRef.current.length) return;

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);

      const isNight = phase === 'night';
      const grid = baseGridRef.current;

      if (isNight && starsRef.current.length > 0) {
        // Night: Twinkle star pixels
        const starColors = palette.starColors?.map(parseHex) || [{ r: 245, g: 248, b: 255 }];
        const stars = starsRef.current;

        stars.forEach((star, idx) => {
          // Smooth sine twinkle based on timestamp and per-star phase offset
          const twinklePhase = timestamp * 0.0025 + idx * 1.618;
          const pulse = (Math.sin(twinklePhase) + 1) * 0.5; // 0 to 1
          const baseColor = grid[star.col]?.[star.row] || { r: 15, g: 20, b: 35 };

          const starTint = starColors[idx % starColors.length];
          const starActiveColor = lerpRgb(baseColor, starTint, 0.45 + pulse * 0.45);

          ctx.fillStyle = `rgb(${starActiveColor.r}, ${starActiveColor.g}, ${starActiveColor.b})`;
          ctx.fillRect(
            star.col * pixelSizePx,
            star.row * pixelSizePx,
            pixelSizePx - 0.3,
            pixelSizePx - 0.3
          );
        });
      } else {
        // Daytime / Dusk / Evening: Pick a randomized subset (~3.5%) to gently shimmer
        const sampleCount = Math.max(6, Math.floor(gridCols * gridRows * 0.035));
        const shimmerIntensity = palette.shimmerIntensity || 0.05;

        for (let i = 0; i < sampleCount; i++) {
          const randCol = Math.floor(Math.random() * gridCols);
          const randRow = Math.floor(Math.random() * gridRows);
          const basePixel = grid[randCol]?.[randRow];
          if (!basePixel) continue;

          // Brightness deviation ±(shimmerIntensity)
          const factor = 1 + (Math.random() * 2 - 1) * shimmerIntensity;
          const r = Math.min(255, Math.max(0, Math.round(basePixel.r * factor)));
          const g = Math.min(255, Math.max(0, Math.round(basePixel.g * factor)));
          const b = Math.min(255, Math.max(0, Math.round(basePixel.b * factor)));

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(
            randCol * pixelSizePx,
            randRow * pixelSizePx,
            pixelSizePx - 0.3,
            pixelSizePx - 0.3
          );
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(shimmerLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [phase, palette, pixelSizePx, gridCols, gridRows, hasContextError]);

  // Graceful degradation fallback if canvas fails
  if (hasContextError) {
    return (
      <div
        className={`fixed inset-0 pointer-events-none -z-10 transition-colors duration-1000 ${className}`}
        style={{
          background: isDarkMode
            ? 'radial-gradient(ellipse at bottom left, #231830 0%, #0D101C 60%, #060810 100%)'
            : 'radial-gradient(ellipse at bottom left, #FFE5B4 0%, #BFE3F7 60%, #EEF4F8 100%)',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-10 w-full h-full block ${className}`}
      style={{
        imageRendering: 'pixelated', // Keeps blocky Minecraft pixel edges razor-sharp
      }}
    />
  );
}
