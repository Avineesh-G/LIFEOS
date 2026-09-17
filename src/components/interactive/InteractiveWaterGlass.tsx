import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface InteractiveWaterGlassProps {
  currentLiters?: number;
  targetLiters?: number;
  size?: number;
  onAddGlass?: () => void;
  className?: string;
}

/**
 * Usable Interactive Water Glass.
 * Shows fluid water level, on-tap slosh wave ripple, and bubble emission.
 */
export default function InteractiveWaterGlass({
  currentLiters = 1.5,
  targetLiters = 3.0,
  size = 28,
  onAddGlass,
  className = '',
}: InteractiveWaterGlassProps) {
  const [isSloshing, setIsSloshing] = useState(false);

  const fillRatio = Math.min(Math.max(currentLiters / targetLiters, 0.1), 1.0);
  const fillPercent = fillRatio * 100;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsSloshing(true);
    setTimeout(() => setIsSloshing(false), 450);
    if (onAddGlass) {
      onAddGlass();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none focus:outline-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={`Hydration: ${currentLiters.toFixed(1)}L / ${targetLiters}L (Tap to log)`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="overflow-visible">
        <defs>
          <clipPath id={`glass-clip-${size}`}>
            {/* Tapered Glass Beaker Interior */}
            <path d="M6 3L7.5 20C7.6 21 8.5 21.8 9.5 21.8H14.5C15.5 21.8 16.4 21 16.5 20L18 3H6Z" />
          </clipPath>
        </defs>

        {/* Glass Outer Rim */}
        <path
          d="M5.5 3H18.5M6 3L7.5 20C7.6 21.1 8.5 22 9.6 22H14.4C15.5 22 16.4 21.1 16.5 20L18 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-cyan-500/70 dark:text-cyan-400/80"
        />

        {/* Liquid Layer inside clip */}
        <g clipPath={`url(#glass-clip-${size})`}>
          {/* Water Fill Rect */}
          <motion.rect
            x="4"
            y={22 - (19 * fillRatio)}
            width="16"
            height={20}
            className="fill-cyan-500/50 dark:fill-cyan-400/60"
            animate={{
              y: 22 - (19 * fillRatio),
              rotate: isSloshing ? [0, -6, 5, -2, 0] : 0,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            style={{ transformOrigin: '50% 100%' }}
          />

          {/* Water Top Wave Surface */}
          <motion.path
            d={`M5 ${22 - (19 * fillRatio)} Q12 ${22 - (19 * fillRatio) + (isSloshing ? 3 : 0.8)} 19 ${22 - (19 * fillRatio)}`}
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-75"
            animate={{
              d: isSloshing
                ? [
                    `M5 ${22 - (19 * fillRatio)} Q12 ${22 - (19 * fillRatio) - 2.5} 19 ${22 - (19 * fillRatio)}`,
                    `M5 ${22 - (19 * fillRatio)} Q12 ${22 - (19 * fillRatio) + 2.5} 19 ${22 - (19 * fillRatio)}`,
                    `M5 ${22 - (19 * fillRatio)} Q12 ${22 - (19 * fillRatio)} 19 ${22 - (19 * fillRatio)}`,
                  ]
                : `M5 ${22 - (19 * fillRatio)} Q12 ${22 - (19 * fillRatio) + 0.8} 19 ${22 - (19 * fillRatio)}`,
            }}
            transition={{ duration: 0.45 }}
          />
        </g>
      </svg>
    </motion.div>
  );
}
