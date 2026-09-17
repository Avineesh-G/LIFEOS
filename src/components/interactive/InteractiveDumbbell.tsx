import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface InteractiveDumbbellProps {
  isCompleted?: boolean;
  size?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Usable Interactive Dumbbell.
 * Plates compress inward with realistic spring physics on click or set complete, paired with heavy haptic feedback.
 */
export default function InteractiveDumbbell({
  isCompleted = false,
  size = 28,
  onClick,
  className = '',
}: InteractiveDumbbellProps) {
  const [isCompressing, setIsCompressing] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    setIsCompressing(true);

    setTimeout(() => setIsCompressing(false), 240);
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none focus:outline-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="Workout Dumbbell (Tap for rep feedback)"
    >
      {/* Completion Aura */}
      {isCompleted && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-emerald-500/25 blur-md pointer-events-none"
        />
      )}

      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="overflow-visible">
        {/* Steel Barbell Bar */}
        <line
          x1="2"
          y1="12"
          x2="22"
          y2="12"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="text-primary-light/70 dark:text-primary-dark/70"
        />

        {/* Left Outer Plate */}
        <motion.rect
          x="3.5"
          y="6.5"
          width="2.5"
          height="11"
          rx="1"
          className={isCompleted ? 'fill-emerald-500 stroke-emerald-600' : 'fill-currentColor text-emerald-500'}
          animate={{ x: isCompressing ? 2.5 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        />

        {/* Left Inner Plate */}
        <motion.rect
          x="6.5"
          y="8.5"
          width="2.2"
          height="7"
          rx="0.8"
          className={isCompleted ? 'fill-emerald-400' : 'fill-currentColor text-emerald-400 dark:text-emerald-400/80'}
          animate={{ x: isCompressing ? 1.5 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        />

        {/* Right Inner Plate */}
        <motion.rect
          x="15.3"
          y="8.5"
          width="2.2"
          height="7"
          rx="0.8"
          className={isCompleted ? 'fill-emerald-400' : 'fill-currentColor text-emerald-400 dark:text-emerald-400/80'}
          animate={{ x: isCompressing ? -1.5 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        />

        {/* Right Outer Plate */}
        <motion.rect
          x="18"
          y="6.5"
          width="2.5"
          height="11"
          rx="1"
          className={isCompleted ? 'fill-emerald-500 stroke-emerald-600' : 'fill-currentColor text-emerald-500'}
          animate={{ x: isCompressing ? -2.5 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        />

        {/* Center Knurled Grip */}
        <line
          x1="10"
          y1="12"
          x2="14"
          y2="12"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="square"
          className="text-primary-light dark:text-primary-dark"
        />
      </svg>
    </motion.div>
  );
}
