import { useState, useEffect } from 'react';

export type GlassTier = 'tier-1' | 'tier-2' | 'tier-3';
export type GlassSetting = 'auto' | 'lite' | 'off';

let currentTier: GlassTier = 'tier-3';
const listeners = new Set<(tier: GlassTier) => void>();

function notifyTier(tier: GlassTier) {
  currentTier = tier;
  listeners.forEach((fn) => fn(tier));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lifeos-glass-tier-changed', { detail: tier }));
  }
}

/**
 * Adaptive Glass Governor (Section 3.3):
 * - Measures rolling 30-frame times in requestAnimationFrame
 * - If p95 frame time exceeds 12ms, steps down one tier (tier-3 -> tier-2 -> tier-1)
 * - After 10s of healthy frame rates, tests stepping back up
 * - Fast scrolling (velocity > 1.2 px/ms) drops dock temporarily to tier-2, returning 150ms after scroll
 * - Battery saver / Reduce Transparency forces tier-1
 */
class GlassGovernorEngine {
  private frameTimes: number[] = [];
  private lastTime = 0;
  private isRunning = false;
  private healthyTimeMs = 0;
  private scrollTimer: any = null;
  private isFastScrolling = false;
  private baseTier: GlassTier = 'tier-3';

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check device baseline
    try {
      const saved = localStorage.getItem('lifeos_glass_setting') as GlassSetting;
      if (saved === 'off') {
        this.baseTier = 'tier-1';
        notifyTier('tier-1');
        return;
      }
      if (saved === 'lite') {
        this.baseTier = 'tier-2';
        notifyTier('tier-2');
        return;
      }
      if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
        this.baseTier = 'tier-2';
      }
    } catch {}

    // Check battery / reduce motion
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
      this.baseTier = 'tier-1';
      notifyTier('tier-1');
      return;
    }

    notifyTier(this.baseTier);
    this.startGovernor();
    this.setupScrollListener();
  }

  private startGovernor() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (now: number) => {
      if (!this.isRunning) return;
      const delta = now - this.lastTime;
      this.lastTime = now;

      if (delta > 0 && delta < 100) {
        this.frameTimes.push(delta);
        if (this.frameTimes.length > 30) {
          this.frameTimes.shift();
        }

        // Calculate p95 frame time
        if (this.frameTimes.length >= 30) {
          const sorted = [...this.frameTimes].sort((a, b) => a - b);
          const p95 = sorted[Math.floor(sorted.length * 0.95)] || 16;

          if (p95 > 12) {
            // Drop tier if possible
            this.healthyTimeMs = 0;
            if (this.baseTier === 'tier-3') {
              this.baseTier = 'tier-2';
              if (!this.isFastScrolling) notifyTier('tier-2');
            } else if (this.baseTier === 'tier-2') {
              this.baseTier = 'tier-1';
              if (!this.isFastScrolling) notifyTier('tier-1');
            }
          } else {
            // Healthy frames
            this.healthyTimeMs += delta;
            if (this.healthyTimeMs > 10000 && this.baseTier !== 'tier-3') {
              this.healthyTimeMs = 0;
              this.baseTier = this.baseTier === 'tier-1' ? 'tier-2' : 'tier-3';
              if (!this.isFastScrolling) notifyTier(this.baseTier);
            }
          }
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private setupScrollListener() {
    let lastY = window.scrollY;
    let lastT = performance.now();

    window.addEventListener(
      'scroll',
      () => {
        const now = performance.now();
        const y = window.scrollY;
        const dt = now - lastT;
        const dy = Math.abs(y - lastY);
        lastY = y;
        lastT = now;

        if (dt > 0) {
          const velocity = dy / dt;
          if (velocity > 1.2 && this.baseTier === 'tier-3') {
            this.isFastScrolling = true;
            notifyTier('tier-2');
          }
        }

        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
          if (this.isFastScrolling) {
            this.isFastScrolling = false;
            notifyTier(this.baseTier);
          }
        }, 150);
      },
      { passive: true }
    );
  }
}

// Instantiate singleton governor
if (typeof window !== 'undefined') {
  new GlassGovernorEngine();
}

export function useGlassTier(): GlassTier {
  const [tier, setTier] = useState<GlassTier>(currentTier);

  useEffect(() => {
    const handler = (t: GlassTier) => setTier(t);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return tier;
}
