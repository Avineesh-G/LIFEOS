import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, AlertTriangle, Check } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { registerDismissible } from '../../utils/backNavigation';

export interface FloatingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'form' | 'chat';
  isDirty?: boolean;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  returnFocusRef?: React.RefObject<HTMLElement>;
  maxWidth?: string;
  fullHeightExpandable?: boolean;
}

export default function FloatingPopup({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  variant = 'form',
  isDirty = false,
  onSave,
  saveDisabled = false,
  saveLoading = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  children,
  returnFocusRef,
  maxWidth = 'max-w-xl',
  fullHeightExpandable = true,
}: FloatingPopupProps) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const dragControls = useDragControls();
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const wasOpenRef = useRef(false);

  // Store trigger element for focus restoration upon close
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      if (!popupRef.current?.contains(document.activeElement)) {
        triggerElementRef.current = (returnFocusRef?.current || document.activeElement) as HTMLElement;
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    }
  }, [isOpen, returnFocusRef]);

  // Request close handler with dirty check guard
  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      triggerHaptic('medium');
      setShowDiscardConfirm(true);
    } else {
      triggerHaptic('light');
      onClose();
    }
  }, [isDirty, onClose]);

  const handleAttemptCloseRef = useRef(handleAttemptClose);
  useEffect(() => {
    handleAttemptCloseRef.current = handleAttemptClose;
  }, [handleAttemptClose]);

  // Confirm discard changes
  const handleConfirmDiscard = () => {
    triggerHaptic('medium');
    setShowDiscardConfirm(false);
    onClose();
  };

  // Hardware Back Button Integration: Dismiss popup before page back navigation
  useEffect(() => {
    if (!isOpen) return;

    document.body.setAttribute('data-subinterface-open', 'true');
    window.dispatchEvent(new CustomEvent('lifeos-subinterface-open'));

    const unregister = registerDismissible('floating-popup', () => {
      handleAttemptCloseRef.current();
      return true;
    });

    return () => {
      unregister();
      document.body.removeAttribute('data-subinterface-open');
      window.dispatchEvent(new CustomEvent('lifeos-subinterface-close'));
    };
  }, [isOpen]);

  // Restore focus if component unmounts while still open
  useEffect(() => {
    return () => {
      if (wasOpenRef.current && triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, []);

  // Virtual Keyboard resize observer via visualViewport
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 120) {
          setKeyboardOffset(heightDiff);
        } else {
          setKeyboardOffset(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isOpen]);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[140] pointer-events-none flex flex-col justify-end">
          {/* 1. Flat Transparent Scrim (z-140): Allows dashboard visibility below floating panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleAttemptClose}
            className="fixed inset-0 bg-transparent ask-lifeos-backdrop z-[140] cursor-pointer pointer-events-auto"
            style={{
              bottom: 'calc(var(--nav-h, 64px) + var(--sab, env(safe-area-inset-bottom, 0px)))',
            }}
            aria-hidden="true"
          />

          {/* 2. Floating Pop-Up Card (z-150): Placed 12px inset from sides, bottom 24px above nav bar */}
          <motion.div
            ref={popupRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'popup-title' : undefined}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : variant === 'chat'
                ? { opacity: 0, scale: 0.88, y: 40 }
                : { opacity: 0, scale: 0.96, y: 30 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 25 }
            }
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 28,
              mass: 0.8,
            }}
            drag={variant === 'form' ? 'y' : false}
            dragControls={variant === 'form' ? dragControls : undefined}
            dragConstraints={variant === 'form' ? { top: -200, bottom: 0 } : undefined}
            dragElastic={variant === 'form' ? { top: 0.1, bottom: 0.5 } : undefined}
            onDragEnd={variant === 'form' ? (_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 400) {
                handleAttemptClose();
              } else if (info.offset.y < -80 && fullHeightExpandable) {
                setIsExpanded(true);
              }
            } : undefined}
            className={`fixed z-[150] left-3.5 right-3.5 mx-auto w-[calc(100vw-28px)] ${maxWidth} pointer-events-auto ask-lifeos-card ${
              variant === 'chat'
                ? 'bg-[#050B0D]/95 dark:bg-[#050B0D]/95 text-white border border-teal-500/30 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.65)]'
                : 'liquid-glass border border-[var(--card-border)] shadow-[0_16px_48px_rgba(0,0,0,0.35)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.65)]'
            } rounded-[28px] overflow-hidden flex flex-col transition-all duration-200`}
            style={{
              bottom: keyboardOffset > 0
                ? `calc(${keyboardOffset}px + 16px)`
                : 'calc(var(--nav-h, 64px) + var(--sab, env(safe-area-inset-bottom, 0px)) + 36px)',
              maxHeight: isExpanded
                ? 'calc(100vh - var(--sat, env(safe-area-inset-top, 0px)) - 24px)'
                : variant === 'chat'
                ? 'calc(75vh - var(--nav-h, 64px))'
                : 'calc(100vh - var(--sat, env(safe-area-inset-top, 0px)) - var(--nav-h, 64px) - var(--sab, env(safe-area-inset-bottom, 0px)) - 48px)',
              height: variant === 'chat' ? 'calc(72vh - var(--nav-h, 64px))' : undefined,
            }}
          >
            {/* Top Grab Handle Bar */}
            <div
              onPointerDown={(e) => {
                if (variant === 'form') {
                  dragControls.start(e);
                }
              }}
              className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0 touch-none"
            >
              <div className="w-9 h-1 rounded-full bg-white/25 hover:bg-accent/40 transition-colors" />
            </div>

            {/* Header (if title or icon provided) */}
            {(title || icon) && (
              <div className="px-5 pb-3 flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 shrink-0 select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  {icon && (
                    <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h2
                        id="popup-title"
                        className="text-base font-black text-primary-light dark:text-primary-dark tracking-tight leading-tight truncate"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-[11px] text-secondary-light dark:text-secondary-dark font-mono truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark active:scale-95 transition-all shrink-0"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className={`flex-1 ${variant === 'chat' ? 'flex flex-col min-h-0 overflow-hidden p-3.5 sm:p-4' : 'overflow-y-auto p-4 sm:p-5 scrollbar-none space-y-4'}`}>
              {children}
            </div>

            {/* Footer Actions (for form variant if onSave or cancel provided) */}
            {variant === 'form' && onSave && (
              <div className="p-3.5 sm:p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="px-4 py-2.5 rounded-2xl border border-black/10 dark:border-white/10 text-xs font-bold text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onSave();
                  }}
                  disabled={saveDisabled || saveLoading}
                  className="px-5 py-2.5 rounded-2xl btn-primary text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
                >
                  {saveLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{saveLabel}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Unsaved Changes Confirmation Modal (Inside Popup system) */}
          <AnimatePresence>
            {showDiscardConfirm && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  className="w-full max-w-xs bg-slate-900 border border-amber-500/30 rounded-3xl p-4 space-y-3 text-white shadow-2xl"
                >
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <AlertTriangle size={20} />
                    <h3 className="text-sm font-bold">Discard Unsaved Changes?</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You have unsaved edits in this form. If you close now, your changes will be lost.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(false)}
                      className="py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                    >
                      Keep Editing
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDiscard}
                      className="py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
