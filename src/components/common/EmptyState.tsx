import React from 'react';
import { motion } from 'framer-motion';
import { OrbiCompanion, OrbiVariant } from '../illustrations/OrbiCompanion';
import { haptics } from '../../utils/haptics';

interface EmptyStateAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'tonal' | 'outlined';
}

interface EmptyStateProps {
  variant?: OrbiVariant;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  mascotSize?: number;
  className?: string;
}

/**
 * Universal EmptyState component for LifeOS featuring Orbi the Astral Mascot.
 * Injects personality, encouraging micro-copy, and tactile action triggers.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'tasks-done',
  title,
  description,
  action,
  secondaryAction,
  mascotSize = 136,
  className = '',
}) => {
  const handleMascotClick = () => {
    haptics.tick();
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 max-w-sm mx-auto ${className}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Interactive Mascot with Tap Feedback */}
      <motion.div
        whileTap={{ scale: 0.9 }}
        onClick={handleMascotClick}
        className="cursor-pointer mb-4"
        title="Say hi to Orbi!"
      >
        <OrbiCompanion variant={variant} size={mascotSize} />
      </motion.div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-semibold text-[var(--md-on-surface,#ffffff)] tracking-tight mb-1.5">
        {title}
      </h3>

      {/* Subtitle / Micro-copy */}
      {description && (
        <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant,#c4c6d0)] leading-relaxed mb-5 max-w-[280px]">
          {description}
        </p>
      )}

      {/* Primary Action Button */}
      {action && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              haptics.snap();
              action.onClick();
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm shadow-md transition-all duration-200"
            style={{
              backgroundColor: 'var(--md-primary, #b51a55)',
              color: 'var(--md-on-primary, #ffffff)',
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </motion.button>

          {/* Optional Secondary Action */}
          {secondaryAction && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                haptics.tick();
                secondaryAction.onClick();
              }}
              className="px-4 py-2 rounded-full font-medium text-xs text-[var(--md-on-surface-variant,#c4c6d0)] hover:text-[var(--md-on-surface,#ffffff)] transition-colors"
            >
              {secondaryAction.label}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};
