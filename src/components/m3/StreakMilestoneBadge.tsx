import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { M3_SPRING_BOUNCE } from '../../utils/motionConfig';
import { triggerHaptic } from '../../utils/haptics';

export interface StreakMilestoneBadgeProps {
  days: number;
  label?: string;
  size?: number;
  compact?: boolean;
  className?: string;
}

const BURST_12_PATH =
  'M 24.00 2.00 Q 28.66 6.61 35.00 4.95 Q 36.73 11.27 43.05 13.00 Q 41.39 19.34 46.00 24.00 Q 41.39 28.66 43.05 35.00 Q 36.73 36.73 35.00 43.05 Q 28.66 41.39 24.00 46.00 Q 19.34 41.39 13.00 43.05 Q 11.27 36.73 4.95 35.00 Q 6.61 28.66 2.00 24.00 Q 6.61 19.34 4.95 13.00 Q 11.27 11.27 13.00 4.95 Q 19.34 6.61 24.00 2.00 Z';

/**
 * Material 3 Expressive Streak Milestone Badge.
 * Uses an expressive 12-point scalloped burst shape reserved for milestone celebrations.
 */
export default function StreakMilestoneBadge({
  days,
  label = 'Day Streak',
  size = 48,
  compact = false,
  className = '',
}: StreakMilestoneBadgeProps) {
  const isMilestone = days >= 7;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] ${className}`}>
        <div className="relative flex items-center justify-center shrink-0 w-5 h-5">
          <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
            <path d={BURST_12_PATH} fill="var(--md-primary)" />
          </svg>
          <Flame size={10} className="absolute inset-0 m-auto text-[var(--md-on-primary)] fill-current" />
        </div>
        <span className="font-stat font-bold text-xs tracking-tight">
          {days}
        </span>
        <span className="text-[10px] font-tag font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
          streak
        </span>
      </div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={() => triggerHaptic('selection')}
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={M3_SPRING_BOUNCE}
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
          <motion.path
            d={BURST_12_PATH}
            fill="var(--md-primary)"
            animate={{
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--md-on-primary)] pointer-events-none">
          <Flame size={size * 0.3} className="fill-current" />
          <span className="font-stat font-bold text-[11px] leading-none mt-0.5">
            {days}
          </span>
        </div>
      </motion.div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-bold text-sm sm:text-base text-[var(--md-on-surface)]">
            {days} {label}
          </span>
          {isMilestone && (
            <Sparkles size={14} className="text-[var(--md-primary)]" />
          )}
        </div>
        <p className="text-[11px] font-tag uppercase tracking-wider text-[var(--md-on-surface-variant)]">
          {days >= 30
            ? 'Legendary Consistency'
            : days >= 7
            ? 'Milestone Unlocked'
            : 'Active Momentum'}
        </p>
      </div>
    </motion.div>
  );
}
