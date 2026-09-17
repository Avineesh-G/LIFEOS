import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface InteractiveLaundryDrumProps {
  status?: 'pending' | 'laundry' | 'received';
  size?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Usable Interactive Laundry Drum.
 * Spins dynamically when laundry is in progress, snaps with fold physics on received, and triggers haptic feedback.
 */
export default function InteractiveLaundryDrum({
  status = 'pending',
  size = 28,
  onClick,
  className = '',
}: InteractiveLaundryDrumProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    if (onClick) {
      onClick();
    }
  };

  const isSpinning = status === 'laundry' || isHovered;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      title={`Laundry Status: ${status} (Tap to cycle)`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="overflow-visible">
        {/* Machine Body Squircle */}
        <rect
          x="3.5"
          y="3"
          width="17"
          height="18"
          rx="3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-teal-600/70 dark:text-teal-400/80"
        />

        {/* Top Control Bar with 2 knobs */}
        <circle cx="7" cy="6" r="0.8" className="fill-current text-teal-600 dark:text-teal-400" />
        <circle cx="10" cy="6" r="0.8" className="fill-current text-teal-600 dark:text-teal-400" />
        <line x1="13" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-teal-600/60 dark:text-teal-400/60" />

        {/* Outer Circular Drum Window */}
        <circle
          cx="12"
          cy="13.5"
          r="5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-teal-500/50"
        />

        {/* Inner Spinning Agitator Paddles */}
        <motion.g
          animate={{ rotate: isSpinning ? 360 : 0 }}
          transition={{ duration: isSpinning ? 1.4 : 0.3, repeat: isSpinning ? Infinity : 0, ease: 'linear' }}
          style={{ transformOrigin: '12px 13.5px' }}
        >
          <path d="M12 9.5V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-teal-500" />
          <path d="M15.5 15.5L14.2 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-teal-500" />
          <path d="M8.5 15.5L9.8 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-teal-500" />
          <circle cx="12" cy="13.5" r="1.4" className="fill-teal-500" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
