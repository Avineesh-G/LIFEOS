import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from '../tokens/icons';
import { GlassSurface } from '../glass/GlassSurface';
import { triggerHaptic } from '../../utils/haptics';

export interface BottomCircleProps {
  tint?: string;
  isCompact?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export function BottomCircle({
  tint = '#0A84FF',
  isCompact = false,
  onClick,
  icon,
  ariaLabel = 'Quick Add',
}: BottomCircleProps) {
  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  return (
    <GlassSurface
      as={motion.button}
      interactive
      tint={tint}
      tintOpacity={0.35}
      onClick={handleClick}
      aria-label={ariaLabel}
      animate={{
        width: isCompact ? 48 : 64,
        height: isCompact ? 48 : 64,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer pointer-events-auto shrink-0 border border-white/20"
    >
      <motion.div
        animate={{ scale: isCompact ? 0.85 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="flex items-center justify-center text-2xl"
      >
        {icon || <Plus size={28} weight="bold" />}
      </motion.div>
    </GlassSurface>
  );
}
