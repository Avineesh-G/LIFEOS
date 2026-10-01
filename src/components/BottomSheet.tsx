import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingPopup from './glass/FloatingPopup';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showDragHandle?: boolean;
  maxHeight?: string;
  maxWidth?: string;
  className?: string;
  title?: string;
  isDirty?: boolean;
}

/**
 * Universal Floating Form Popup Component.
 * Migrated from full-width bottom sheet to floating pop-up card above bottom nav bar.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-xl',
  title,
  isDirty = false,
}: BottomSheetProps) {
  return (
    <FloatingPopup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="form"
      maxWidth={maxWidth}
      isDirty={isDirty}
    >
      {children}
    </FloatingPopup>
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
 * Small Centered Dialog / Modal for confirmations (e.g. Delete, Alerts).
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
      window.dispatchEvent(new CustomEvent('lifeos-subinterface-open'));
      document.body.setAttribute('data-subinterface-open', 'true');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.removeAttribute('data-subinterface-open');
        document.body.style.overflow = prevOverflow;
        window.dispatchEvent(new CustomEvent('lifeos-subinterface-close'));
      };
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
          {/* Viewport backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-transparent gpu-composited"
          />

          {/* Centered Modal Content Card */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            className={`relative z-10 w-full ${maxWidth} liquid-glass rounded-[28px] p-5 sm:p-6 border border-[var(--card-border)] shadow-2xl overflow-y-auto max-h-[85vh] gpu-composited ${className}`}
            onClick={(e) => e.stopPropagation()}
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
