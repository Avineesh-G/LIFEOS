/**
 * LifeOS Motion Presets (Framer Motion Spring Physics)
 * Liquid Glass Specification Section 4.5
 * Transforms and Opacity ONLY.
 */

import type { Transition } from 'framer-motion';

export const MOTION_SPRINGS = {
  default: {
    type: 'spring',
    stiffness: 400,
    damping: 35,
    mass: 1,
  } as Transition,
  snappy: {
    type: 'spring',
    stiffness: 520,
    damping: 40,
    mass: 1,
  } as Transition,
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 22,
    mass: 1,
  } as Transition,
  sheet: {
    type: 'spring',
    stiffness: 300,
    damping: 32,
    mass: 1,
  } as Transition,
  reduced: {
    type: 'tween',
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,
} as const;

export const TAP_SCALE = {
  card: 0.97,
  button: 0.96,
  glassPill: 1.04,
  lift: 1.03,
};
