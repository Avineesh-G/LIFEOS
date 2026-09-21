import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

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
 * High-performance 120fps Full-Bleed BottomSheet rendered via Portal into document.body.
 * Optimized with hardware-accelerated transforms, zero layout thrashing, and swipe-down-to-dismiss.
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
  const dragControls = useDragControls();

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
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-auto">
          {/* Viewport backdrop (optimized blur to preserve 120fps compositing) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' } as any}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 gpu-composited"
            style={{ width: '100vw', height: '100vh' }}
          />

          {/* Full-bleed bottom sheet on mobile, centered modal card on sm+ */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 34,
              stiffness: 300,
              mass: 0.8,
            }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className={`relative z-10 w-full ${maxWidth} liquid-glass rounded-t-[32px] sm:rounded-[32px] p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.75rem))] sm:pb-6 border-t sm:border border-[var(--card-border)] shadow-2xl overflow-y-auto overscroll-contain no-scrollbar gpu-composited touch-pan-y ${className}`}
            style={{
              maxHeight,
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
              WebkitOverflowScrolling: 'touch',
            }}
            onClick={e => e.stopPropagation()}
          >
            {showDragHandle && (
              <div
                className="w-full pt-1 pb-3 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none -mt-2 mb-2 shrink-0"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600/80 shrink-0 active:scale-95 transition-transform" />
              </div>
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
            onTouchMove={e => e.preventDefault()}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 gpu-composited"
            style={{ width: '100vw', height: '100vh' }}
          />

          {/* Centered card dialog */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            className={`relative z-10 w-full ${maxWidth} liquid-glass rounded-[32px] p-6 border border-[var(--card-border)] shadow-2xl text-center gpu-composited ${className}`}
            style={{
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
            }}
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
