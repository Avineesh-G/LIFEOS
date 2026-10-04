import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, AlertTriangle, Sparkles, Copy, Save } from 'lucide-react';

export type FeedbackChipType = 'success' | 'info' | 'warning' | 'copy' | 'save' | 'sparkle';

export interface FeedbackChipProps {
  isOpen: boolean;
  message: string;
  type?: FeedbackChipType;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const TYPE_ICONS: Record<FeedbackChipType, React.ReactNode> = {
  success: <Check size={14} className="stroke-[2.5]" />,
  info: <Info size={14} className="stroke-[2.2]" />,
  warning: <AlertTriangle size={14} className="stroke-[2.2]" />,
  copy: <Copy size={13} className="stroke-[2.2]" />,
  save: <Save size={13} className="stroke-[2.2]" />,
  sparkle: <Sparkles size={13} className="stroke-[2.2]" />,
};

/**
 * Universal Sliding Feedback Chip for LifeOS.
 * Confirms micro-actions with clean typography and semantic vector icons (Zero Emojis).
 */
export const FeedbackChip: React.FC<FeedbackChipProps> = ({
  isOpen,
  message,
  type = 'success',
  icon,
  className = '',
}) => {
  const displayIcon = icon ?? TYPE_ICONS[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 460, damping: 28 }}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none select-none ${className}`}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-surface-container-highest,#36343b)] text-[var(--md-on-surface,#ffffff)] border border-[var(--md-outline-variant)] shadow-xl backdrop-blur-md">
            <span className="w-5 h-5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] flex items-center justify-center shrink-0 shadow-xs">
              {displayIcon}
            </span>
            <span className="text-xs font-semibold tracking-tight text-[var(--md-on-surface,#ffffff)] whitespace-nowrap">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackChip;
