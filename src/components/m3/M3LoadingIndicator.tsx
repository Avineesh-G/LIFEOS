import React from 'react';
import { motion } from 'framer-motion';

export interface M3LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Material 3 Expressive Organic Loading Indicator.
 * Morphs smoothly across M3 shape families (Circle -> Squircle -> Pill -> Petal)
 * with continuous fluid transformation, replacing generic spinning rings.
 */
export function M3LoadingIndicator({
  size = 'md',
  label,
  className = '',
}: M3LoadingIndicatorProps) {
  const dimension = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: dimension, height: dimension }}
      >
        {/* Ambient Halo */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-[var(--md-primary)]/20 blur-md"
        />

        {/* Primary Morphing Shape */}
        <motion.div
          animate={{
            borderRadius: [
              '50%',
              '25% 75% 70% 30% / 30% 30% 70% 70%',
              '16px',
              '70% 30% 30% 70% / 60% 40% 60% 40%',
              '50%',
            ],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.08, 0.94, 1.05, 1],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: [0.2, 0, 0, 1],
          }}
          style={{
            width: dimension * 0.85,
            height: dimension * 0.85,
          }}
          className="bg-gradient-to-tr from-[var(--md-primary)] to-[var(--md-secondary)] shadow-sm"
        />
      </div>

      {label && (
        <span className="text-xs font-semibold text-[var(--md-on-surface-variant)] tracking-tight animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

export default M3LoadingIndicator;
