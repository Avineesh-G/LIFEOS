import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import LifeOSRive from './LifeOSRive';
import { useRiveController } from '../../hooks/useRiveController';
import { triggerHaptic } from '../../utils/haptics';

export interface StreakIndicatorProps {
  streak: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Premium Interactive Streak Indicator (Zero-Emoji).
 * Replaces standard fire emojis with an interactive Rive/SVG flame vector.
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

  // Fallback Vector: Clean, layered SVG flame with ambient amber glow (No emoji)
  const fallbackFlame = (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse" />
      <Flame
        size={isSmall ? 14 : isLarge ? 24 : 18}
        className="relative z-10 text-amber-500 fill-amber-500/20 transition-transform duration-300 group-hover:scale-110"
      />
    </div>
  );

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={handleTap}
      className={`group cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono shadow-sm select-none ${className}`}
    >
      <div className={isSmall ? 'w-4 h-4' : isLarge ? 'w-7 h-7' : 'w-5 h-5'}>
        <LifeOSRive
          src="/animations/streak_counter.riv"
          stateMachines="Streak_State_Machine"
          artboard="Flame"
          onRiveReady={onRiveReady}
          fallback={fallbackFlame}
        />
      </div>

      <div className="flex items-center gap-1.5 font-bold tracking-tight">
        <span className={isSmall ? 'text-xs' : isLarge ? 'text-base' : 'text-sm'}>
          {streak}
        </span>
        <span className="text-[11px] font-sans font-semibold text-secondary-light dark:text-secondary-dark uppercase tracking-wider">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
