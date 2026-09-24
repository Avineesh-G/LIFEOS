import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { registerDismissible } from '../../utils/backNavigation';
import { PALETTE } from '../../theme/palette';
import {
  M3SaveSymbolAnimation,
  M3EditSymbolAnimation,
  M3DeleteSymbolAnimation,
  M3DeleteForeverIcon,
} from './M3Shapes';

export interface ConfirmDeleteOptions {
  title?: string;
  itemName?: string;
  message?: string;
  section?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
}

export interface FeedbackOptions {
  message: string;
  title?: string;
  section?: string;
  durationMs?: number;
}

interface M3FeedbackContextValue {
  confirmDelete: (options: ConfirmDeleteOptions) => Promise<boolean>;
  showSavedFeedback: (options: FeedbackOptions) => void;
  showEditedFeedback: (options: FeedbackOptions) => void;
  showDeleteFeedback: (options: FeedbackOptions) => void;
}

const M3FeedbackContext = createContext<M3FeedbackContextValue | null>(null);

export function useM3Feedback() {
  const ctx = useContext(M3FeedbackContext);
  if (!ctx) {
    throw new Error('useM3Feedback must be used within an M3FeedbackProvider');
  }
  return ctx;
}

export function M3FeedbackProvider({ children }: { children: React.ReactNode }) {
  // Confirm Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    stage: 'confirm' | 'deleting' | 'done';
    options: ConfirmDeleteOptions | null;
  }>({
    isOpen: false,
    stage: 'confirm',
    options: null,
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  // Centered Expressive Action Feedback Modal State (Saved / Edited / Deleted)
  const [feedback, setFeedback] = useState<{
    type: 'saved' | 'edited' | 'deleted';
    title?: string;
    message: string;
    section?: string;
  } | null>(null);

  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dismiss on Android Hardware Back Gesture
  useEffect(() => {
    if (deleteDialog.isOpen && deleteDialog.stage === 'confirm') {
      return registerDismissible('m3-confirm-dialog', () => {
        handleCancelDelete();
        return true;
      });
    }
  }, [deleteDialog.isOpen, deleteDialog.stage]);

  // Resolves color for a given section ID, defaulting to current CSS --md-primary
  const resolveSectionColor = useCallback((section?: string) => {
    if (section && PALETTE[section]?.seed) {
      return PALETTE[section].seed;
    }
    if (section && section === 'tasks') return '#059669';
    if (section && section === 'timetable') return '#D97706';
    if (section && section === 'spending') return '#15803D';
    if (section && (section === 'outings' || section === 'outing')) return '#8C500A';
    if (section && section === 'notes') return '#8436E9';
    return 'var(--md-primary, #8436E9)';
  }, []);

  // 1. Confirm Delete Flow
  const confirmDelete = useCallback((options: ConfirmDeleteOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      triggerHaptic('medium');
      setDeleteDialog({
        isOpen: true,
        stage: 'confirm',
        options,
      });
    });
  }, []);

  const handleCancelDelete = useCallback(() => {
    triggerHaptic('light');
    setDeleteDialog({ isOpen: false, stage: 'confirm', options: null });
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleExecuteDelete = useCallback(async () => {
    if (!deleteDialog.options) return;
    triggerHaptic('heavy');
    // Transition immediately to M3 Deleted Symbol Animation stage
    setDeleteDialog((prev) => ({ ...prev, stage: 'deleting' }));

    try {
      await Promise.all([
        Promise.resolve(deleteDialog.options.onConfirm()),
        // Allow the M3 Deleted Symbol Animation to play fully (650ms)
        new Promise((r) => setTimeout(r, 680)),
      ]);
    } catch (err) {
      console.error('[M3Feedback] Delete execution error:', err);
    } finally {
      setDeleteDialog({ isOpen: false, stage: 'confirm', options: null });
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      }
    }
  }, [deleteDialog.options]);

  // 2. Action Feedback (Saved / Edited / Deleted) — Centered Dialog Presentation
  const showSavedFeedback = useCallback(
    (opts: FeedbackOptions) => {
      triggerHaptic('save');
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback({
        type: 'saved',
        title: opts.title || 'Saved!',
        message: opts.message,
        section: opts.section,
      });
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, opts.durationMs || 1400);
    },
    []
  );

  const showEditedFeedback = useCallback(
    (opts: FeedbackOptions) => {
      triggerHaptic('save');
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback({
        type: 'edited',
        title: opts.title || 'Updated!',
        message: opts.message,
        section: opts.section,
      });
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, opts.durationMs || 1400);
    },
    []
  );

  const showDeleteFeedback = useCallback(
    (opts: FeedbackOptions) => {
      triggerHaptic('heavy');
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback({
        type: 'deleted',
        title: opts.title || 'Deleted',
        message: opts.message,
        section: opts.section,
      });
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, opts.durationMs || 1400);
    },
    []
  );

  const activeDeleteColor = resolveSectionColor(deleteDialog.options?.section);

  return (
    <M3FeedbackContext.Provider
      value={{
        confirmDelete,
        showSavedFeedback,
        showEditedFeedback,
        showDeleteFeedback,
      }}
    >
      {children}

      {/* ── 1. M3 Expressive Delete Confirmation Modal with Morphing Animation ── */}
      <AnimatePresence>
        {deleteDialog.isOpen && deleteDialog.options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={deleteDialog.stage === 'confirm' ? handleCancelDelete : undefined}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="w-full max-w-sm rounded-[28px] bg-white dark:bg-[#1E1929] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-6 sm:p-7 overflow-hidden relative select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteDialog.stage === 'confirm' ? (
                /* Confirmation Stage: "Are you sure?" with Google delete_forever symbol */
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* M3 Scallop / Squircle Icon Container in Section Theme */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-[20px] opacity-15"
                      style={{ backgroundColor: activeDeleteColor }}
                    />
                    <div
                      className="relative w-10 h-10 rounded-[14px] flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: activeDeleteColor }}
                    >
                      <M3DeleteForeverIcon size={22} color="#FFFFFF" />
                    </div>
                  </div>

                  {/* Title & Body Text */}
                  <div className="space-y-1.5 px-2">
                    <h3 className="text-lg font-black text-primary-light dark:text-primary-dark tracking-tight">
                      {deleteDialog.options.title || 'Delete Item?'}
                    </h3>
                    {deleteDialog.options.itemName && (
                      <p className="text-xs font-bold text-secondary-light dark:text-secondary-dark truncate max-w-[240px] mx-auto bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 rounded-full">
                        "{deleteDialog.options.itemName}"
                      </p>
                    )}
                    <p className="text-xs text-secondary-light/80 dark:text-secondary-dark/80 leading-relaxed pt-1">
                      {deleteDialog.options.message ||
                        'Are you sure? This item will be permanently removed and cannot be recovered.'}
                    </p>
                  </div>

                  {/* Action Buttons: Cancel (Outlined Pill) & Continue (Filled Pill) */}
                  <div className="grid grid-cols-2 gap-3 w-full pt-3">
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="py-3 px-4 rounded-full border border-black/[0.12] dark:border-white/[0.15] text-secondary-light dark:text-secondary-dark font-bold text-xs hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all active:scale-95"
                    >
                      {deleteDialog.options.cancelLabel || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteDelete}
                      className="py-3 px-4 rounded-full text-white font-bold text-xs shadow-md transition-all active:scale-95 hover:opacity-95"
                      style={{
                        backgroundColor: '#DC2626',
                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                      }}
                    >
                      {deleteDialog.options.confirmLabel || 'Continue'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Deleting Stage: Official Google M3 Deleted Symbol Animation with Trash + X */
                <motion.div
                  key="deleting-animation"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-6 space-y-4"
                >
                  <M3DeleteSymbolAnimation accentColor="#DC2626" size={68} />
                  <div className="text-center space-y-1">
                    <motion.h4
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-base font-black text-primary-light dark:text-primary-dark"
                    >
                      Deleted
                    </motion.h4>
                    <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium">
                      Item permanently removed
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Centered Material 3 Action Feedback Modal (Saved / Edited / Deleted) ── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none"
            onClick={() => setFeedback(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: 'spring', stiffness: 440, damping: 28 }}
              className="w-full max-w-xs sm:max-w-sm rounded-[28px] bg-white dark:bg-[#1E1929] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-6 sm:p-7 overflow-hidden relative flex flex-col items-center justify-center text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Centered Animated Symbol */}
              <div className="py-1">
                {feedback.type === 'saved' ? (
                  <M3SaveSymbolAnimation
                    accentColor={resolveSectionColor(feedback.section)}
                    size={72}
                  />
                ) : feedback.type === 'edited' ? (
                  <M3EditSymbolAnimation
                    accentColor={resolveSectionColor(feedback.section)}
                    size={72}
                  />
                ) : (
                  <M3DeleteSymbolAnimation accentColor="#DC2626" size={72} />
                )}
              </div>

              {/* Title & Body Message */}
              <div className="space-y-1 px-2">
                <motion.h4
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base sm:text-lg font-black text-primary-light dark:text-primary-dark tracking-tight"
                >
                  {feedback.title}
                </motion.h4>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-secondary-light dark:text-secondary-dark font-medium leading-relaxed max-w-[240px] mx-auto"
                >
                  {feedback.message}
                </motion.p>
              </div>

              {/* Progress timer bar */}
              <div className="w-24 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: resolveSectionColor(feedback.section) }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.35, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </M3FeedbackContext.Provider>
  );
}
