import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface SuggestionChipProps extends HTMLMotionProps<'button'> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function SparkleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z" />
    </svg>
  );
}

export const SuggestionChip = React.forwardRef<HTMLButtonElement, SuggestionChipProps>(({
  title,
  subtitle,
  icon,
  active = false,
  className = '',
  style,
  ...props
}, ref) => {
  const { isLite } = usePerformanceMode();

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`
        group relative flex items-center gap-3 overflow-hidden rounded-[22px] px-4 py-3 text-left
        border border-[var(--rim,rgba(255,255,255,0.10))]
        bg-[var(--glass-2)] hover:bg-[var(--glass-3)]
        transition-all duration-200 touch-manipulation outline-none select-none
        ${active ? 'border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.12)]' : ''}
        ${className}
      `}
      style={{
        backdropFilter: isLite ? 'none' : 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: isLite ? 'none' : 'blur(20px) saturate(140%)',
        ...style,
      }}
      {...props}
    >
      {/* Soft teal/cyan radial blob behind chip */}
      {!isLite && (
        <div
          className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full blur-xl opacity-20 transition-opacity group-hover:opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--accent, #2DD4BF) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Sparkle or Custom Icon Badge */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.15)] text-[var(--accent-text)] border border-[rgba(var(--accent-rgb),0.25)]">
        {icon || <SparkleIcon className="w-4 h-4 text-[var(--accent-text)] animate-pulse" />}
      </div>

      {/* Title & Subtitle */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-primary">
          {title}
        </div>
        {subtitle && (
          <div className="truncate text-xs text-secondary mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </motion.button>
  );
});

SuggestionChip.displayName = 'SuggestionChip';
export default SuggestionChip;
