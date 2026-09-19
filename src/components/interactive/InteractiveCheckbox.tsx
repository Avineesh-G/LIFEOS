import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { M3_SPRING_BOUNCE, M3_SHAPE_TRANSITION } from '../../utils/motionConfig';

export interface InteractiveCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

// Exactly matched 8-segment quadratic bezier paths for smooth M3 Expressive shape morphing
const CIRCLE_PATH =
  'M 16.00 2.50 Q 21.59 2.50 25.55 6.45 Q 29.50 10.41 29.50 16.00 Q 29.50 21.59 25.55 25.55 Q 21.59 29.50 16.00 29.50 Q 10.41 29.50 6.45 25.55 Q 2.50 21.59 2.50 16.00 Q 2.50 10.41 6.45 6.45 Q 10.41 2.50 16.00 2.50 Z';

const COOKIE_PATH =
  'M 16.00 2.00 Q 20.29 5.65 25.90 6.10 Q 26.35 11.71 30.00 16.00 Q 26.35 20.29 25.90 25.90 Q 20.29 26.35 16.00 30.00 Q 11.71 26.35 6.10 25.90 Q 5.65 20.29 2.00 16.00 Q 5.65 11.71 6.10 6.10 Q 11.71 5.65 16.00 2.00 Z';

/**
 * Material 3 Expressive Scoped Shape-Morphing Checkbox.
 * Morphs from a clean circle (incomplete) into an M3 scalloped "cookie" burst shape (complete)
 * with celebratory spring physics and dynamic on-primary checkmark reveal.
 */
export default function InteractiveCheckbox({
  checked,
  onChange,
  size = 24,
  className = '',
  disabled = false,
}: InteractiveCheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    triggerHaptic(checked ? 'light' : 'success');
    onChange(!checked);
  };

  return (
    <motion.div
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
      aria-checked={checked}
      whileTap={{ scale: disabled ? 1 : 0.88 }}
      whileHover={{ scale: disabled ? 1 : 1.06 }}
      transition={M3_SHAPE_TRANSITION}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none focus:outline-none shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 32 32"
        className="w-full h-full overflow-visible"
        animate={{
          scale: checked ? [0.85, 1.12, 1] : 1,
          rotate: checked ? [0, -8, 0] : 0,
        }}
        transition={M3_SPRING_BOUNCE}
      >
        {/* Shape-Morphing Background & Border (Circle <-> M3 Scalloped Cookie) */}
        <motion.path
          animate={{
            d: checked ? COOKIE_PATH : CIRCLE_PATH,
            fill: checked ? 'var(--md-primary)' : 'rgba(0, 0, 0, 0)',
            stroke: checked ? 'var(--md-primary)' : 'var(--md-outline)',
            strokeWidth: checked ? 0 : 2,
          }}
          transition={M3_SHAPE_TRANSITION}
        />

        {/* Dynamic On-Primary Checkmark */}
        <motion.path
          d="M9 16.5 L14 21.5 L23 10.5"
          fill="none"
          stroke="var(--md-on-primary)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{
            pathLength: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 28,
            duration: 0.22,
          }}
        />
      </motion.svg>
    </motion.div>
  );
}
