import React from 'react';
import { motion } from 'framer-motion';

export interface M3StatWidgetProps {
  value: string | number;
  unit?: string;
  label: string;
  sublabel?: string;
  highlight?: {
    text: string;
    variant?: 'primary' | 'secondary' | 'neutral';
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Material 3 Expressive Widget-Style Stat Card (Reference Image 9 pattern)
 * Features:
 * - Large bold numeral (Space Grotesk tabular-nums with clamp sizing)
 * - One single highlighted data point in accent color (not the whole card tinted)
 * - Generous padding
 * - Minimal chrome with tonal depth
 */
export default function M3StatWidget({
  value,
  unit,
  label,
  sublabel,
  highlight,
  icon,
  onClick,
  className = '',
}: M3StatWidgetProps) {
  const isClickable = Boolean(onClick);

  return (
    <motion.div
      whileHover={isClickable ? { y: -2, scale: 1.015 } : undefined}
      whileTap={isClickable ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 450, damping: 26 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-[24px] p-5 sm:p-6 m3-elevation-2 border border-[var(--md-outline-variant)] flex flex-col justify-between select-none ${
        isClickable ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Top row: Label + icon or badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-bold font-tag uppercase tracking-wider text-[var(--md-on-surface-variant)] line-clamp-2 break-words leading-tight min-w-0">
          {label}
        </span>
        {icon && (
          <span className="w-8 h-8 rounded-[16px] bg-[var(--md-surface-container-high)] flex items-center justify-center text-[var(--md-primary)] shrink-0">
            {icon}
          </span>
        )}
      </div>

      {/* Center: Large bold numeral with clamp sizing and M3 Numeral role */}
      <div className="my-1">
        <div className="flex items-baseline gap-1 flex-wrap text-[var(--md-on-surface)]">
          <span className="m3-numeral text-2xl compact:text-3xl sm:text-4xl font-extrabold tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-xs sm:text-sm font-semibold text-[var(--md-on-surface-variant)] shrink-0">
              {unit}
            </span>
          )}
        </div>
        {sublabel && (
          <p className="text-[11px] text-[var(--md-on-surface-variant)] font-medium mt-0.5 line-clamp-2 break-words">
            {sublabel}
          </p>
        )}
      </div>

      {/* Bottom: Single highlighted data point in accent color */}
      {highlight && (
        <div className="mt-3 pt-2.5 border-t border-[var(--md-outline-variant)]/60 flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-tag font-bold tracking-wider uppercase bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] break-words line-clamp-1">
            {highlight.text}
          </span>
        </div>
      )}
    </motion.div>
  );
}
