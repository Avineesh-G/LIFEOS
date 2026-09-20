import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import LifeOSRive from './LifeOSRive';
import { useRiveController } from '../../hooks/useRiveController';
import { triggerHaptic } from '../../utils/haptics';

export interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  stats?: Array<{ label: string; value: string | number }>;
}

/**
 * Premium Interactive Victory Modal (Zero-Emoji).
 * Triggers interactive celebratory vectors on workout completion or major milestones.
 */
export default function VictoryModal({
  isOpen,
  onClose,
  title = 'Workout Completed',
  subtitle = 'Great session! Your progressive overload and volume have been recorded.',
  stats = [],
}: VictoryModalProps) {
  const { onRiveReady, fireTrigger } = useRiveController('Victory_State_Machine');

  useEffect(() => {
    if (isOpen) {
      fireTrigger('triggerCelebrate');
      triggerHaptic('success');
    }
  }, [isOpen, fireTrigger]);

  if (!isOpen) return null;

  // Fallback Victory Element (Zero Emojis, pure vector glass trophy)
  const fallbackVictory = (
    <div className="relative flex flex-col items-center justify-center p-6">
      <div 
        className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}
      />
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-xl shadow-amber-500/30">
        <Trophy size={38} strokeWidth={2.2} />
      </div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-[#12141c] border border-black/10 dark:border-white/10 shadow-2xl z-10 text-center p-6"
        >
          {/* Interactive Vector Animation / Fallback */}
          <div className="w-40 h-40 mx-auto -mt-2">
            <LifeOSRive
              src="/animations/workout_victory.riv"
              stateMachines="Victory_State_Machine"
              artboard="Trophy"
              onRiveReady={onRiveReady}
              fallback={fallbackVictory}
            />
          </div>

          <h3 className="text-xl font-black tracking-tight text-primary-light dark:text-primary-dark mt-2">
            {title}
          </h3>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1.5 leading-relaxed">
            {subtitle}
          </p>

          {/* Stats Grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-5 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
              {stats.map((st, i) => (
                <div key={i} className="text-center p-1.5">
                  <p className="text-xs font-black text-primary-light dark:text-primary-dark font-mono">
                    {st.value}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-muted-light dark:text-muted-dark tracking-wider mt-0.5">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Close Action */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent via-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
