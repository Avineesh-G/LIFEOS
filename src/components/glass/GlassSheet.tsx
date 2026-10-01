import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';
import { useReducedMotion } from '../../utils/motionConfig';

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function GlassSheet({
  isOpen,
  onClose,
  children,
  title,
  className = '',
}: GlassSheetProps) {
  const { isLite } = usePerformanceMode();
  const prefersReducedMotion = useReducedMotion();

  // Listen for Android hardware back button / ESC key to close sheet
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleRootBack = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('lifeos-back-button', handleRootBack);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('lifeos-back-button', handleRootBack);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
          {/* Dimmed backdrop with flat translucent fallback in Lite mode (Max 3 blurs rule) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.22, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-0 bg-black/65 dark:bg-black/80"
            style={{
              backdropFilter: isLite ? 'none' : 'blur(12px)',
              WebkitBackdropFilter: isLite ? 'none' : 'blur(12px)',
            }}
            onClick={onClose}
          />

          {/* Draggable Pop-Up Sheet Container (~70% Height) */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 400) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: prefersReducedMotion ? 'tween' : 'spring',
              stiffness: 340,
              damping: 30,
              mass: 0.8,
              duration: prefersReducedMotion ? 0.15 : undefined,
            }}
            className={`
              relative z-10 h-[72vh] max-h-[72vh] w-full overflow-hidden rounded-t-[32px] p-4 sm:p-5
              border-t border-[var(--rim,rgba(255,255,255,0.15))]
              bg-[#050B0D] dark:bg-[#050B0D] text-primary-light dark:text-primary-dark
              shadow-2xl outline-none flex flex-col
              ${className}
            `}
            style={{
              backdropFilter: isLite ? 'none' : 'blur(24px) saturate(140%)',
              WebkitBackdropFilter: isLite ? 'none' : 'blur(24px) saturate(140%)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            }}
          >
            {/* Grab Handle Bar (Swipe down to close indicator) */}
            <div className="flex justify-center pb-2 pt-1 cursor-grab active:cursor-grabbing touch-none shrink-0">
              <div className="h-1.5 w-12 rounded-full bg-white/30 dark:bg-white/30" />
            </div>

            {title && (
              <div className="mb-2 text-center text-sm font-bold text-primary-light dark:text-primary-dark shrink-0">
                {title}
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default GlassSheet;
