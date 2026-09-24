import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface SegmentedTogglePillProps<T extends string = string> {
  id?: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  activeColor?: string;
}

/**
 * Material 3 Expressive Segmented Toggle Pill Group
 * One wide pill container housing 2-5 segments with an active segment highlighted solid
 * via spring-physics layout transition. High-contrast colors guaranteed in both light and dark themes.
 */
export default function SegmentedTogglePill<T extends string = string>({
  id,
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  fullWidth = false,
  activeColor,
}: SegmentedTogglePillProps<T>) {
  const generatedId = useId();
  const pillLayoutId = id || `segmentedActivePill_${generatedId.replace(/:/g, '')}`;

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-4 text-xs sm:text-sm',
    lg: 'py-2.5 px-5 text-sm',
  }[size];

  const isFullWidth = fullWidth || className.includes('w-full');

  return (
    <div
      role="radiogroup"
      className={`${isFullWidth ? 'w-full flex' : 'inline-flex'} items-center p-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] shadow-xs select-none ${className}`}
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
                ? 'text-white font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={pillLayoutId}
                className="absolute inset-0 rounded-full shadow-sm"
                style={{
                  backgroundColor: activeColor || 'var(--md-primary, #15803D)',
                }}
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
                className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-slate-200'
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
