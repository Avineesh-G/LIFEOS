import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showDragHandle?: boolean;
  maxHeight?: string;
  maxWidth?: string;
  className?: string;
}

/**
 * Shared Full-Bleed BottomSheet rendered via Portal into document.body.
 * Escapes all CSS containing-block traps caused by transformed/animated ancestors.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  showDragHandle = true,
  maxHeight = '90vh',
  maxWidth = 'sm:max-w-lg',
  className = '',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-auto">
          {/* Full-bleed viewport backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            style={{ width: '100vw', height: '100vh' }}
          />

          {/* Full-bleed bottom sheet on mobile, centered modal card on sm+ */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative z-10 w-full ${maxWidth} liquid-glass rounded-t-[32px] sm:rounded-[32px] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] sm:pb-6 border-t sm:border border-white/80 dark:border-white/[0.12] shadow-2xl overflow-y-auto no-scrollbar ${className}`}
            style={{ maxHeight }}
            onClick={e => e.stopPropagation()}
          >
            {showDragHandle && (
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-4 shrink-0" />
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

/**
 * Shared Centered Dialog / Modal rendered via Portal into document.body.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-sm',
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
          {/* Full-bleed viewport backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            style={{ width: '100vw', height: '100vh' }}
          />

          {/* Centered card dialog */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`relative z-10 w-full ${maxWidth} liquid-glass rounded-[32px] p-6 border border-white/80 dark:border-white/[0.12] shadow-2xl text-center ${className}`}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default BottomSheet;
