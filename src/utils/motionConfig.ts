import { useEffect, useState } from 'react';

// ─── Reduced Motion Hook ──────────────────────────────────────────────────────

/**
 * Returns true if the OS-level "prefers-reduced-motion" setting is active.
 * Reads once on mount and reacts to changes (e.g. user toggles it while app is open).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

import { getEffectivePerformanceMode } from './performanceMode';

// ─── Official Material 3 Expressive Motion Schemes ───────────────────────────

/**
 * Google's M3 Expressive spring motion schemes:
 * - MotionScheme.standard: calm, settles quickly, minimal overshoot (stiffness ~300, damping ~30)
 *   Apply to: page transitions, list scrolling, modal open/close
 * - MotionScheme.expressive: bouncier, visible overshoot, more energy (stiffness ~420, damping ~16)
 *   Apply to: nav tab switching, toggle/switch morphing, FAB press, streak badge, chip selection
 * - In Lite performance mode, spring overshoot is eliminated with critical damping (damping 40)
 */
export const MotionScheme = {
  get standard() {
    const isLite = typeof window !== 'undefined' && getEffectivePerformanceMode() === 'lite';
    return {
      type: 'spring' as const,
      stiffness: isLite ? 260 : 300,
      damping: isLite ? 40 : 30,
      mass: 1,
    };
  },
  get expressive() {
    const isLite = typeof window !== 'undefined' && getEffectivePerformanceMode() === 'lite';
    return {
      type: 'spring' as const,
      stiffness: isLite ? 260 : 420,
      damping: isLite ? 40 : 16,
      mass: 1,
    };
  },
} as const;

// ─── Easing Curves ────────────────────────────────────────────────────────────

/** Primary ease-out spring curve — entering content feels deliberate */
export const EASE_OUT_SPRING = [0.16, 1, 0.3, 1] as const;

/** Slightly snappier curve for exits — leaving should feel faster than entering */
export const EASE_OUT_FAST = [0.4, 0, 1, 1] as const;

// ─── Page-Level Transitions ───────────────────────────────────────────────────

/** Duration in seconds for page enter animations (instant 120 FPS response) */
const PAGE_ENTER_DURATION = 0.16;
/** Duration in seconds for page exit animations */
const PAGE_EXIT_DURATION = 0.08;
/** Duration for reduced-motion fallback (opacity-only, near-instant) */
const REDUCED_DURATION = 0.05;

import { detectDeviceTier } from './performanceEngine';

// ─── Unified Continuous Spatial Flow Page Transitions ───────────────────────────

/**
 * Page Transitions Disabled (Zero-Lag Root Fix):
 * Horizontal route sliding & AnimatePresence dual-mounting caused frame drops
 * and stuck routes on mobile WebView. All route variants now render instantaneously.
 */
export const UNIFIED_SPATIAL_FLOW = {
  initial: { x: 0, opacity: 1 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: {
    x: 0,
    opacity: 1,
    transition: { duration: 0 },
  },
};

/** Tier 2 (Mid-Range / Balanced): Instant route switch */
export const TIER2_SPATIAL_FLOW = {
  initial: { x: 0, opacity: 1 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: {
    opacity: 1,
    transition: { duration: 0 },
  },
};

/** Reduced-motion and Tier 3: Instant switch */
export const PAGE_VARIANTS_REDUCED = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: {
    opacity: 1,
    transition: { duration: 0 },
  },
};

/**
 * Triggers a direct route navigation (View Transition animations disabled
 * to eliminate main-thread snapshot stalls on Android WebView).
 */
export function navigateWithViewTransition(
  navigate: (path: string, options?: any) => void,
  to: string,
  options?: any
) {
  navigate(to, options);
}

/**
 * Returns zero-cost instant page props (route transitions disabled globally).
 */
export function getPageMotionProps(_reducedMotion: boolean, direction: number = 1) {
  return {
    custom: direction,
    variants: PAGE_VARIANTS_REDUCED,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
  };
}

// ─── List Item Stagger ────────────────────────────────────────────────────────

/** Container variants for staggered list entry */
export const STAGGER_CONTAINER = {
  hidden: {},
  get show() {
    const isLite = typeof window !== 'undefined' && getEffectivePerformanceMode() === 'lite';
    return {
      transition: {
        staggerChildren: isLite ? 0 : 0.03,
        delayChildren: isLite ? 0 : 0.05,
      },
    };
  },
};

/** Individual item variants (used inside a stagger container) */
export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT_SPRING } },
};

/** Reduced-motion stagger item — opacity only */
export const STAGGER_ITEM_REDUCED = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: REDUCED_DURATION, ease: 'linear' } },
};

// ─── Micro-interaction: Tap Feedback ─────────────────────────────────────────

/** Standard tap scale for buttons and tappable cards */
export const TAP_SCALE = { scale: 0.97 };

/** Slightly more pronounced tap for nav items */
export const NAV_TAP_SCALE = { scale: 0.93 };

/** No-op tap for reduced motion (don't animate scale at all) */
export const TAP_SCALE_REDUCED = {};

/** Transition for the tap spring-back */
export const TAP_TRANSITION = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 28,
  mass: 0.6,
};

// ─── Material 3 Expressive Spring Physics ──────────────────────────────────

/** M3 Standard Spring — balanced, responsive for everyday transitions */
export const M3_SPRING_STANDARD = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
  mass: 1,
};

/** M3 Emphasized Spring — energetic, slightly underdamped for expressive moments */
export const M3_SPRING_EMPHASIZED = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 26,
  mass: 0.8,
};

/** M3 Decelerated Spring — smooth settle for incoming elements */
export const M3_SPRING_DECELERATED = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 32,
  mass: 1,
};

/** M3 Celebratory Bounce Spring — for milestone badges and task completion */
export const M3_SPRING_BOUNCE = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 18,
  mass: 0.6,
};

/** M3 Expressive Shape Morph Transition */
export const M3_SHAPE_TRANSITION = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
  mass: 0.7,
};

