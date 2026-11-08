import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { registerDismissible } from '../../utils/backNavigation';
import { PALETTE } from '../../theme/palette';
import { Trash, Check, PencilSimple } from '../../ui/tokens/icons';

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
    if (section && section === 'drive') return '#0A84FF';
    return '#8436E9';
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
    // Transition immediately to Deleted stage
    setDeleteDialog((prev) => ({ ...prev, stage: 'deleting' }));

    try {
      await Promise.all([
        Promise.resolve(deleteDialog.options.onConfirm()),
        new Promise((r) => setTimeout(r, 650)),
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
        title: opts.title || 'Saved Successfully',
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
        title: opts.title || 'Updated Successfully',
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

      {/* ── 1. LifeOS Native Delete Confirmation Modal with Dim Backdrop ── */}
      <AnimatePresence>
        {deleteDialog.isOpen && deleteDialog.options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 sm:p-6 select-none"
            onClick={deleteDialog.stage === 'confirm' ? handleCancelDelete : undefined}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="w-full max-w-sm rounded-[28px] bg-[#1C1C1E] border border-white/10 shadow-2xl p-6 sm:p-7 overflow-hidden relative select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteDialog.stage === 'confirm' ? (
                /* Confirmation Stage: "Are you sure?" with clean Phosphor Trash Icon */
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
                    <Trash size={28} weight="duotone" />
                  </div>

                  {/* Title & Body Text */}
                  <div className="space-y-1.5 px-2">
                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                      {deleteDialog.options.title || 'Delete Item?'}
                    </h3>
                    {deleteDialog.options.itemName && (
                      <p className="text-[12px] font-semibold text-white/90 truncate max-w-[240px] mx-auto bg-white/10 px-3 py-1 rounded-full">
                        "{deleteDialog.options.itemName}"
                      </p>
                    )}
                    <p className="text-[13px] text-white/60 leading-relaxed pt-1">
                      {deleteDialog.options.message ||
                        'Are you sure? This item will be permanently removed and cannot be recovered.'}
                    </p>
                  </div>

                  {/* Action Buttons: Cancel & Delete */}
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="py-3 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/10 text-white/80 font-semibold text-[13px] border border-white/10 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                      {deleteDialog.options.cancelLabel || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteDelete}
                      className="py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[13px] shadow-lg shadow-rose-500/30 transition-all active:scale-95 touch-manipulation cursor-pointer"
                    >
                      {deleteDialog.options.confirmLabel || 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Deleting Stage: Clean Deleted confirmation with Phosphor Trash */
                <motion.div
                  key="deleting-animation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-4 space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
                    <Trash size={28} weight="fill" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-[17px] font-bold text-white tracking-tight">
                      Deleted
                    </h4>
                    <p className="text-[13px] text-white/60 font-normal">
                      Item permanently removed
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Centered Action Feedback Modal with Dim Backdrop (Saved / Edited / Deleted) ── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 sm:p-6 select-none"
            onClick={() => setFeedback(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ type: 'spring', stiffness: 440, damping: 28 }}
              className="w-full max-w-xs sm:max-w-sm rounded-[28px] bg-[#1C1C1E] border border-white/10 shadow-2xl p-6 sm:p-7 overflow-hidden relative flex flex-col items-center justify-center text-center space-y-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Centered Phosphor Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  feedback.type === 'deleted'
                    ? 'bg-rose-500/15 border border-rose-500/25 text-rose-400'
                    : feedback.type === 'saved'
                    ? 'bg-[#30D158]/15 border border-[#30D158]/25 text-[#30D158]'
                    : 'bg-[#0A84FF]/15 border border-[#0A84FF]/25 text-[#0A84FF]'
                }`}
              >
                {feedback.type === 'deleted' ? (
                  <Trash size={28} weight="duotone" />
                ) : feedback.type === 'saved' ? (
                  <Check size={28} weight="bold" />
                ) : (
                  <PencilSimple size={28} weight="duotone" />
                )}
              </div>

              {/* Title & Body Message in Crisp White LifeOS Typography */}
              <div className="space-y-1 px-2">
                <h4 className="text-[17px] font-bold text-white tracking-tight">
                  {feedback.title}
                </h4>
                {feedback.message && (
                  <p className="text-[13px] text-white/60 font-normal leading-relaxed max-w-[240px] mx-auto">
                    {feedback.message}
                  </p>
                )}
              </div>

              {/* Progress timer bar */}
              <div className="w-20 h-1 rounded-full bg-white/10 overflow-hidden mt-1">
                <motion.div
                  className={`h-full rounded-full ${
                    feedback.type === 'deleted'
                      ? 'bg-rose-500'
                      : feedback.type === 'saved'
                      ? 'bg-[#30D158]'
                      : 'bg-[#0A84FF]'
                  }`}
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
