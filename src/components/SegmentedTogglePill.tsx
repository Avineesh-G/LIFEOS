import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface SegmentedTogglePillProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Material 3 Expressive Segmented Toggle Pill Group (Reference Image 7 pattern)
 * One wide pill container housing 2-5 segments with an active segment highlighted solid
 * via spring-physics layout transition.
 */
export default function SegmentedTogglePill<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  fullWidth = false,
}: SegmentedTogglePillProps<T>) {
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-3.5 text-xs sm:text-sm',
    lg: 'py-2.5 px-4 text-sm',
  }[size];

  const isFullWidth = fullWidth || className.includes('w-full');

  return (
    <div
      role="radiogroup"
      className={`${isFullWidth ? 'w-full flex' : 'inline-flex'} items-center p-1 rounded-full bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] shadow-none select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              if (!isSelected) {
                triggerHaptic('light');
                onChange(opt.value);
              }
            }}
            className={`relative flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-200 focus:outline-none z-10 active:scale-95 ${sizeClasses} ${
              isFullWidth ? 'flex-1 min-w-0 text-center' : ''
            } ${
              isSelected
                ? 'text-[var(--md-on-primary)] font-semibold'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmentedActivePill"
                className="absolute inset-0 rounded-full bg-[var(--md-primary)]"
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                  mass: 0.8,
                }}
              />
            )}

            {opt.icon && (
              <span className="relative z-10 shrink-0 flex items-center">
                {opt.icon}
              </span>
            )}

            <span className="relative z-10 tracking-tight whitespace-nowrap">
              {opt.label}
            </span>

            {opt.badge !== undefined && (
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-black/5 dark:bg-white/10 text-[var(--md-on-surface-variant)]'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
