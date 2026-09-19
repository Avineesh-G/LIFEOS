import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import LifeOSRive from './LifeOSRive';
import { useRiveController } from '../../hooks/useRiveController';
import { triggerHaptic } from '../../utils/haptics';
import { BURST_CLIP_PATH } from '../../theme/shapes';

export interface StreakIndicatorProps {
  streak: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Premium Interactive Streak Indicator (Zero-Emoji).
 * Uses M3 Expressive 8-point burst shape (reserved for streaks/milestones)
 * and interactive Rive/SVG flame vector.
 */
export default function StreakIndicator({
  streak,
  label = 'Day Streak',
  size = 'md',
  className = '',
}: StreakIndicatorProps) {
  const { onRiveReady, setNumber } = useRiveController('Streak_State_Machine');

  useEffect(() => {
    // Map streak to level 1-5
    const level = Math.min(Math.max(streak, 1), 5);
    setNumber('streakLevel', level);
  }, [streak, setNumber]);

  const handleTap = () => {
    triggerHaptic('selection');
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Fallback Vector: Clean SVG flame in white inside the Flame Orange burst
  const fallbackFlame = (
    <div className="relative flex items-center justify-center">
      <Flame
        size={isSmall ? 13 : isLarge ? 20 : 16}
        className="relative z-10 text-white fill-white transition-transform duration-300 group-hover:scale-110"
      />
    </div>
  );

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={handleTap}
      className={`group cursor-pointer inline-flex items-center gap-2 select-none ${className}`}
    >
      {/* 8-Point Scallop / Burst Badge in Flame Orange #FF7A45 (Prompt B7 system-level accent) */}
      <div 
        className={`flex items-center justify-center shrink-0 bg-[#FF7A45] text-white shadow-sm p-1.5 transition-transform duration-200 group-hover:scale-105 ${
          isSmall ? 'w-6 h-6' : isLarge ? 'w-10 h-10' : 'w-8 h-8'
        }`}
        style={{ clipPath: BURST_CLIP_PATH }}
      >
        <div className={isSmall ? 'w-3.5 h-3.5' : isLarge ? 'w-5 h-5' : 'w-4 h-4'}>
          <LifeOSRive
            src="/animations/streak_counter.riv"
            stateMachines="Streak_State_Machine"
            artboard="Flame"
            onRiveReady={onRiveReady}
            fallback={fallbackFlame}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-bold tracking-tight">
        <span className={`font-stat text-[#FF7A45] font-extrabold ${isSmall ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}`}>
          {streak}
        </span>
        <span className="text-[10px] font-tag font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
