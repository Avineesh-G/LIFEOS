import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassSurface } from '../glass/GlassSurface';
import { MOTION_SPRINGS } from '../tokens/motion';
import { triggerHaptic } from '../../utils/haptics';
import { registerDismissible } from '../../utils/backNavigation';

export interface ActionSheetOption {
  key?: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  message,
  options,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return registerDismissible('active-actionsheet', () => {
        onClose();
        return true;
      });
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end p-3 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={MOTION_SPRINGS.sheet}
            className="relative z-10 flex flex-col gap-2 w-full max-w-md mx-auto"
          >
            {/* Options Group */}
            <GlassSurface className="rounded-[24px] overflow-hidden flex flex-col border border-white/14 shadow-2xl">
              {(title || message) && (
                <div className="px-4 py-3.5 text-center border-b border-white/10">
                  {title && <div className="text-sm font-semibold text-white">{title}</div>}
                  {message && <div className="text-xs text-[rgba(235,235,245,0.60)] mt-0.5">{message}</div>}
                </div>
              )}

              {options.map((opt, i) => (
                <button
                  key={opt.key || opt.label}
                  type="button"
                  onClick={() => {
                    triggerHaptic(opt.destructive ? 'error' : 'selection');
                    onClose();
                    opt.onClick();
                  }}
                  className={`w-full py-3.5 px-4 flex items-center justify-center gap-3 font-semibold text-[17px] active:bg-white/10 select-none cursor-pointer ${
                    i > 0 || title || message ? 'border-t border-white/10' : ''
                  } ${opt.destructive ? 'text-[#FF453A]' : 'text-[#0A84FF]'}`}
                >
                  {opt.icon && <span className="flex items-center justify-center shrink-0">{opt.icon}</span>}
                  <span>{opt.label}</span>
                </button>
              ))}
            </GlassSurface>

            {/* Cancel Button */}
            <GlassSurface
              as="button"
              interactive
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-[24px] text-center font-bold text-[17px] text-[#0A84FF] select-none cursor-pointer border border-white/14 shadow-xl"
            >
              {cancelLabel}
            </GlassSurface>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
