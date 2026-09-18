import React from 'react';

/**
 * Skeleton loading primitives for LifeOS.
 *
 * All skeletons:
 * - Match the pixel-native card shape (liquid-glass class, same border-radius and border)
 * - Use opacity pulse (not a moving gradient) — cheaper on Android WebView
 * - Are gated by the caller with a 150ms delay to avoid flash-of-loading-state on fast connections
 */

// ── Base pulse block ──────────────────────────────────────────────────────────

interface SkeletonBaseProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A simple pulsing rounded block. Use as a building block for larger skeletons. */
export function SkeletonBlock({ className = '', style }: SkeletonBaseProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-black/[0.07] dark:bg-white/[0.08] ${className}`}
      style={style}
    />
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  className?: string;
  /** Height of the card. Defaults to h-32 */
  height?: string;
}

/**
 * A full-width card-shaped skeleton.
 * Matches the pixel-native card style (same rounded-[26px], border, shadow).
 */
export function SkeletonCard({ className = '', height = 'h-32' }: SkeletonCardProps) {
  return (
    <div className={`liquid-glass border border-[var(--card-border)] rounded-[26px] shadow-sm overflow-hidden ${height} ${className}`}>
      <div className="w-full h-full animate-pulse bg-black/[0.05] dark:bg-white/[0.05]" />
    </div>
  );
}

// ── Stat row skeleton (3-column) ───────────────────────────────────────────────

/**
 * Three-column stat block skeleton — matches the stat grid pattern
 * used in StudyHeatmap, GymExerciseHistory, etc.
 */
export function SkeletonStatRow({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-3 gap-3 sm:gap-4 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="liquid-glass border border-[var(--card-border)] rounded-[26px] p-4 sm:p-5 text-center shadow-sm"
        >
          <SkeletonBlock className="h-7 w-3/4 mx-auto mb-2" />
          <SkeletonBlock className="h-3 w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );
}

// ── List item skeleton ─────────────────────────────────────────────────────────

interface SkeletonListItemProps {
  /** Show a leading icon circle. Default true. */
  withIcon?: boolean;
  className?: string;
}

/**
 * A single list-row skeleton — matches a typical session/expense/task row.
 */
export function SkeletonListItem({ withIcon = true, className = '' }: SkeletonListItemProps) {
  return (
    <div className={`liquid-glass border border-[var(--card-border)] rounded-[20px] p-4 flex items-center gap-3 ${className}`}>
      {withIcon && <SkeletonBlock className="w-10 h-10 rounded-2xl flex-shrink-0" />}
      <div className="flex-1 space-y-2 min-w-0">
        <SkeletonBlock className="h-3.5 w-2/3" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="h-4 w-12 flex-shrink-0" />
    </div>
  );
}

// ── Heatmap cell skeleton ──────────────────────────────────────────────────────

/**
 * A tiny square cell for use inside the heatmap grid skeleton.
 */
export function SkeletonHeatmapCell() {
  return (
    <div className="w-3 h-3 rounded-sm animate-pulse bg-black/[0.07] dark:bg-white/[0.08]" />
  );
}

// ── Dashboard hero card skeleton ───────────────────────────────────────────────

/**
 * Matches the main hero card on Home (large rounded card with a stat line and sub-label).
 */
export function SkeletonHeroCard({ className = '' }: { className?: string }) {
  return (
    <div className={`liquid-glass border border-[var(--card-border)] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-10 w-36 mb-2" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

// ── 150ms gated skeleton wrapper ───────────────────────────────────────────────

interface SkeletonGateProps {
  /** If true, show actual children; otherwise show skeleton */
  ready: boolean;
  /** Skeleton content to show while loading */
  skeleton: React.ReactNode;
  /** Actual content */
  children: React.ReactNode;
  /** Delay in ms before skeleton appears. Default 150ms. Prevents flash on fast loads. */
  delayMs?: number;
}

/**
 * Renders skeleton content only if data hasn't arrived within `delayMs`.
 * If data arrives in under 150ms, skeleton never shows — no flash-of-loading-state.
 */
export function SkeletonGate({ ready, skeleton, children, delayMs = 150 }: SkeletonGateProps) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (ready) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [ready, delayMs]);

  if (ready) return <>{children}</>;
  if (!show) return null; // still within 150ms window — show nothing
  return <>{skeleton}</>;
}
