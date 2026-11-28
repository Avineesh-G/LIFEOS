import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  color: _color,
  trackColor = 'rgba(255, 255, 255, 0.08)',
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className}`}
      style={{
        height: `${height}px`,
        backgroundColor: trackColor,
      }}
    >
      <motion.div
        className="h-full w-full rounded-full"
        style={{
          transformOrigin: 'left',
          background: 'linear-gradient(90deg, var(--app-accent, #7B4B36) 0%, var(--app-accent-end, #A46D52) 100%)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: clamped }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  );
}
