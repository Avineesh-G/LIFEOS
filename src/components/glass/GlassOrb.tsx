import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface GlassOrbProps extends HTMLMotionProps<'button'> {
  icon?: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const GlassOrb = React.forwardRef<HTMLButtonElement, GlassOrbProps>(({
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
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`
        group relative flex h-12 w-12 items-center justify-center rounded-2xl
        border border-[var(--rim,rgba(255,255,255,0.15))]
        bg-[var(--glass-3)] text-primary
        shadow-md transition-all duration-300 touch-manipulation outline-none
        ${active ? 'border-[var(--accent,#3B82F6)] bg-[rgba(var(--accent-rgb),0.25)] text-[var(--accent-text,#38BDF8)]' : ''}
        ${className}
      `}
      style={{
        backdropFilter: isLite ? 'none' : 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: isLite ? 'none' : 'blur(20px) saturate(140%)',
        ...style,
      }}
      {...props}
    >
      {/* Slow breathing aura (Full performance mode only) */}
      {!isLite && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-md transition-opacity duration-500 group-hover:opacity-80"
          style={{
            background: 'radial-gradient(circle, var(--accent,#38BDF8) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Subtle top rim highlight */}
      <div className="pointer-events-none absolute inset-x-2 top-0 h-[1px] bg-white/30" />

      <div className="relative z-10 flex items-center justify-center">
        {icon}
      </div>
    </motion.button>
  );
});

GlassOrb.displayName = 'GlassOrb';
export default GlassOrb;
