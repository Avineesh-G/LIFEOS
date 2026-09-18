import React from 'react';
import { motion } from 'framer-motion';
import { TAP_SCALE, TAP_TRANSITION } from '../utils/motionConfig';
import { useReducedMotion } from '../utils/motionConfig';

type MotionButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  /** Override tap scale. Defaults to { scale: 0.97 }. */
  tapScale?: Record<string, number>;
  /** Extra className for the motion.button wrapper */
  className?: string;
};

/**
 * A button that gives consistent press-down (scale) feedback using Framer Motion.
 * Automatically suppresses scale animation when prefers-reduced-motion is active.
 *
 * Drop-in replacement for <button> in any component.
 */
export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, tapScale, className = '', ...rest }, ref) => {
    const reduced = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        className={className}
        whileTap={reduced ? undefined : (tapScale ?? TAP_SCALE)}
        transition={TAP_TRANSITION}
        {...(rest as any)}
      >
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = 'MotionButton';
