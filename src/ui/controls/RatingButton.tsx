import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export type RatingLevel = 'again' | 'hard' | 'good' | 'easy';

export interface RatingButtonProps {
  level: RatingLevel;
  label: string;
  intervalText?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const RATING_COLORS: Record<RatingLevel, string> = {
  again: '#FF453A',
  hard: '#FF9F0A',
  good: '#30D158',
  easy: '#0A84FF',
};

export function RatingButton({
  level,
  label,
  intervalText,
  onClick,
  disabled = false,
  className = '',
}: RatingButtonProps) {
  const tint = RATING_COLORS[level];

  const handleClick = () => {
    if (disabled) return;
    triggerHaptic(level === 'again' ? 'error' : level === 'hard' ? 'medium' : 'success');
    onClick();
  };

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
      onClick={handleClick}
      disabled={disabled}
      className={`glass-flat flex-1 min-w-0 py-2.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer transition-colors active:bg-[var(--active-bg)] ${
        disabled ? 'opacity-35 pointer-events-none' : ''
      } ${className}`}
      style={
        {
          color: tint,
          '--active-bg': `color-mix(in srgb, ${tint} 24%, rgba(255,255,255,0.06))`,
        } as any
      }
    >
      <span className="text-[14px] font-semibold tracking-tight">{label}</span>
      {intervalText && (
        <span className="text-[11px] text-[rgba(235,235,245,0.48)] font-normal">{intervalText}</span>
      )}
    </motion.button>
  );
}

export default RatingButton;
