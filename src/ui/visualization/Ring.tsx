import React from 'react';
import { motion } from 'framer-motion';

export interface RingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Ring({
  progress,
  size = 64,
  strokeWidth = 6,
  color = '#FF9F0A',
  trackColor = '#2C2C2E',
  children,
  className = '',
}: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
