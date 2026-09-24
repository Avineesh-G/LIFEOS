import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface M3WavyProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  height?: number;
  activeColor?: string;
  trackColor?: string;
}

/**
 * Material 3 Expressive Wavy Progress Bar
 * Matches user's uploaded Android M3 Expressive photo:
 * - Left side: Lavender (#C084FC) fluid sine wave
 * - Separator: 6px clean gap
 * - Right side: Deep purple (#581C87) solid straight track with rounded caps
 * - Fluid infinite wave animation
 */
export default function M3WavyProgressBar({
  progress = 0,
  className = '',
  height = 20,
  activeColor = '#C084FC',
  trackColor = '#581C87',
}: M3WavyProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const wavelength = 24; // pixel period for one full sine cycle
  const amplitude = 3.5;  // vertical wave height
  const centerY = height / 2;
  const strokeWidth = 4.5;

  // Pre-generate sine wave path across 1200px to accommodate any phone screen width
  const totalPoints = 1200;
  let wavePath = `M 0 ${centerY}`;
  for (let x = 0; x < totalPoints; x += wavelength) {
    const half = wavelength / 2;
    const cpX1 = x + wavelength * 0.18;
    const cpX2 = x + wavelength * 0.32;
    const cpX3 = x + half + wavelength * 0.18;
    const cpX4 = x + half + wavelength * 0.32;

    wavePath += ` C ${cpX1} ${centerY - amplitude * 1.3}, ${cpX2} ${centerY - amplitude * 1.3}, ${x + half} ${centerY}`;
    wavePath += ` C ${cpX3} ${centerY + amplitude * 1.3}, ${cpX4} ${centerY + amplitude * 1.3}, ${x + wavelength} ${centerY}`;
  }

  const remainingPercent = Math.max(0, 100 - clampedProgress);

  return (
    <div
      className={`relative w-full flex items-center select-none ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* 1. Active Animated Wavy Section */}
      <div
        className="h-full overflow-hidden transition-all duration-300 ease-out"
        style={{ width: `${clampedProgress}%` }}
      >
        <svg
          className="h-full overflow-visible"
          style={{ width: '1200px' }}
          viewBox={`0 0 1200 ${height}`}
        >
          <motion.path
            d={wavePath}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ x: [-wavelength, 0] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </svg>
      </div>

      {/* 2. Gap & Inactive Straight Rounded Track */}
      {remainingPercent > 2 && (
        <div
          className="h-full flex items-center pl-1.5 transition-all duration-300 ease-out flex-1"
        >
          <div
            className="w-full rounded-full"
            style={{
              height: `${strokeWidth}px`,
              backgroundColor: trackColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
