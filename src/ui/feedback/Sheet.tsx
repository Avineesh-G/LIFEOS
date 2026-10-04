import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MOTION_SPRINGS } from '../tokens/motion';
import { triggerHaptic } from '../../utils/haptics';
import { registerDismissible } from '../../utils/backNavigation';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  detent?: 'half' | 'full'; // 'half' = 60%, 'full' = 92%
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  detent = 'half',
  title,
  children,
  footer,
  className = '',
}: SheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return registerDismissible('active-sheet', () => {
        onClose();
        return true;
      });
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) {
      triggerHaptic('light');
      onClose();
    }
  };

  const heightStyle = detent === 'full' ? 'h-[92vh]' : 'h-[62vh] max-h-[580px]';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end pointer-events-auto">
          {/* Dimmed Deep Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Inset Sheet Surface */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={MOTION_SPRINGS.sheet}
            className={`relative mx-2 mb-2 rounded-[36px] ${heightStyle} bg-[#1C1C1E] border border-white/12 flex flex-col overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.95)] z-10 ${className}`}
          >
            {/* Grabber Handle with Dedicated Drag Zone */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              className="w-full pt-3 pb-2 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="w-10 h-1.5 rounded-full bg-white/30 hover:bg-white/50 transition-colors" />
            </motion.div>

            {/* Optional Title Header */}
            {title && (
              <div className="px-6 py-2.5 text-center text-lg font-bold text-white shrink-0 select-none border-b border-white/6">
                {title}
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain touch-pan-y">
              {children}
            </div>

            {/* Optional Sticky Action Footer */}
            {footer && (
              <div className="px-5 py-3 border-t border-white/8 bg-[#1C1C1E]/90 backdrop-blur-md shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
