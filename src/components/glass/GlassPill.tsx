import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface GlassPillProps extends HTMLMotionProps<'button'> {
  active?: boolean;
  variant?: 'surface' | 'tinted' | 'glowing';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const GlassPill = React.forwardRef<HTMLButtonElement, GlassPillProps>(({
  active = false,
  variant = 'surface',
  icon,
  children,
  className = '',
  style,
  ...props
}, ref) => {
  const { isLite } = usePerformanceMode();

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium
        transition-all duration-200 touch-manipulation select-none outline-none
        border border-[var(--rim,rgba(255,255,255,0.10))]
        ${active 
          ? 'bg-[var(--accent-soft,rgba(var(--accent-rgb),0.2))] text-[var(--accent-text,#38BDF8)] border-[var(--accent,rgba(59,130,246,0.5))] shadow-sm' 
          : 'bg-[var(--glass-2)] hover:bg-[var(--glass-3)] text-primary hover:border-white/20'
        }
        ${variant === 'glowing' ? 'shadow-[0_0_16px_rgba(var(--accent-rgb),0.3)]' : ''}
        ${className}
      `}
      style={{
        backdropFilter: isLite ? 'none' : 'var(--glass-blur, blur(24px) saturate(140%))',
        WebkitBackdropFilter: isLite ? 'none' : 'var(--glass-blur, blur(24px) saturate(140%))',
        ...style,
      }}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
      {children}
    </motion.button>
  );
});

GlassPill.displayName = 'GlassPill';
export default GlassPill;
