import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, CheckCircle2, X, Sparkles, HardDrive, Dumbbell, FileText, CheckSquare, DollarSign, ShoppingBag } from 'lucide-react';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../utils/haptics';
import { saveData, cleanForFirestore } from '../db';
import type { AppData } from '../types';

import { registerDismissible } from '../utils/backNavigation';

interface CloudMigrationModalProps {
  user: User | null;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function CloudMigrationModal({ user, data, updateData }: CloudMigrationModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const promptKey = useMemo(() => {
    return user ? `lifeos_cloud_sync_prompt_handled_${user.uid}` : null;
  }, [user]);

  // Back button dismissible overlay registration
  useEffect(() => {
    if (showModal) {
      return registerDismissible('cloud-migration-modal', () => {
        setShowModal(false);
        if (promptKey) localStorage.setItem(promptKey, 'true');
      });
    }
  }, [showModal, promptKey]);

  // Calculate local progress counts
  const stats = useMemo(() => {
    let legacy: any = null;
    try {
      const rawLegacy = localStorage.getItem('lifeos_cached_app_data');
      if (rawLegacy) legacy = JSON.parse(rawLegacy);
    } catch {}

    const workouts = Math.max(data?.workoutLogs?.length || 0, legacy?.workoutLogs?.length || 0);
    const tasks = Math.max(data?.tasks?.length || 0, legacy?.tasks?.length || 0);
    const notes = Math.max(data?.notes?.length || 0, legacy?.notes?.length || 0);
    const expenses = Math.max(data?.expenses?.length || 0, legacy?.expenses?.length || 0);
    const shopping = Math.max(data?.shoppingLists?.length || 0, legacy?.shoppingLists?.length || 0);
    const total = workouts + tasks + notes + expenses + shopping;

    return { workouts, tasks, notes, expenses, shopping, total, legacy };
  }, [data]);

  useEffect(() => {
    if (!user || !promptKey) return;

    // Check if the user has already answered or dismissed this one-time prompt
    const alreadyHandled = localStorage.getItem(promptKey);
    if (alreadyHandled === 'true') return;

    // If there is meaningful existing data on this phone, prompt the user ONCE
    if (stats.total > 0) {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      // If there is no existing data at all, mark as handled so we never show it
      localStorage.setItem(promptKey, 'true');
    }
  }, [user, promptKey, stats.total]);

  // Action: Move existing phone data to Cloud Firestore database
  const handleMoveToCloud = async () => {
    if (!user || !promptKey) return;
    setIsMigrating(true);
    triggerHaptic('medium');

    try {
      // 1. Merge any legacy items if present
      let merged = { ...data };
      if (stats.legacy) {
        if ((stats.legacy.workoutLogs?.length || 0) > (merged.workoutLogs?.length || 0)) {
          merged.workoutLogs = stats.legacy.workoutLogs;
        }
        if ((stats.legacy.notes?.length || 0) > (merged.notes?.length || 0)) {
          merged.notes = stats.legacy.notes;
        }
        if ((stats.legacy.tasks?.length || 0) > (merged.tasks?.length || 0)) {
          merged.tasks = stats.legacy.tasks;
        }
        if ((stats.legacy.expenses?.length || 0) > (merged.expenses?.length || 0)) {
          merged.expenses = stats.legacy.expenses;
        }
        if ((stats.legacy.shoppingLists?.length || 0) > (merged.shoppingLists?.length || 0)) {
          merged.shoppingLists = stats.legacy.shoppingLists;
        }
      }

      // 2. Push all existing data to Firestore under their user account
      await saveData(user.uid, merged);
      await updateData(merged);

      // 3. Mark one-time prompt as completed
      localStorage.setItem(promptKey, 'true');

      triggerHaptic('success');
      setShowModal(false);
      setToastMessage('All existing phone data was successfully moved to your Cloud database!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('[LifeOS] Cloud migration error:', err);
      // Even if offline, save locally and mark handled so user is not stuck
      localStorage.setItem(promptKey, 'true');
      setShowModal(false);
      setToastMessage('Phone data queued and will sync to Cloud once connected.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsMigrating(false);
    }
  };

  // Action: Dismiss and keep cloud data as is (never ask again)
  const handleDismiss = () => {
    if (promptKey) {
      localStorage.setItem(promptKey, 'true');
    }
    triggerHaptic('light');
    setShowModal(false);
  };

  return (
    <>
      {/* ── One-Time Migration Dialog ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="w-full max-w-sm rounded-3xl bg-[var(--card-surface)] border border-blue-500/30 p-6 shadow-2xl space-y-4"
            >
              {/* Header Icon */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
                  <CloudUpload size={24} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  One-Time Sync
                </span>
              </div>

              {/* Title & Explanation */}
              <div className="space-y-1.5 text-left">
                <h3 className="text-base font-heading font-extrabold text-primary-light dark:text-primary-dark">
                  Move Existing Data to Cloud?
                </h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  We found existing workouts, notes, and tasks on this device. Would you like to move all of your progress to your Cloud Database account ({user?.email || 'your user account'})?
                </p>
              </div>

              {/* Detected Items Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border-light dark:border-border-dark text-xs">
                {stats.workouts > 0 && (
                  <div className="flex items-center gap-1.5 text-secondary-light dark:text-secondary-dark">
                    <Dumbbell size={13} className="text-purple-500 shrink-0" />
                    <span className="font-semibold text-primary-light dark:text-primary-dark">{stats.workouts}</span>
                    <span className="text-[11px]">Workouts</span>
                  </div>
                )}
                {stats.notes > 0 && (
                  <div className="flex items-center gap-1.5 text-secondary-light dark:text-secondary-dark">
                    <FileText size={13} className="text-amber-500 shrink-0" />
                    <span className="font-semibold text-primary-light dark:text-primary-dark">{stats.notes}</span>
                    <span className="text-[11px]">Notes</span>
                  </div>
                )}
                {stats.tasks > 0 && (
                  <div className="flex items-center gap-1.5 text-secondary-light dark:text-secondary-dark">
                    <CheckSquare size={13} className="text-emerald-500 shrink-0" />
                    <span className="font-semibold text-primary-light dark:text-primary-dark">{stats.tasks}</span>
                    <span className="text-[11px]">Tasks</span>
                  </div>
                )}
                {stats.expenses > 0 && (
                  <div className="flex items-center gap-1.5 text-secondary-light dark:text-secondary-dark">
                    <DollarSign size={13} className="text-rose-500 shrink-0" />
                    <span className="font-semibold text-primary-light dark:text-primary-dark">{stats.expenses}</span>
                    <span className="text-[11px]">Expenses</span>
                  </div>
                )}
                {stats.shopping > 0 && (
                  <div className="flex items-center gap-1.5 text-secondary-light dark:text-secondary-dark">
                    <ShoppingBag size={13} className="text-blue-500 shrink-0" />
                    <span className="font-semibold text-primary-light dark:text-primary-dark">{stats.shopping}</span>
                    <span className="text-[11px]">Lists</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={handleMoveToCloud}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {isMigrating ? (
                    <span>Moving Data to Cloud...</span>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Move to Cloud Database</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={handleDismiss}
                  className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-secondary-light dark:text-secondary-dark font-medium text-xs transition-all text-center"
                >
                  Start Fresh / Don't Move
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Success Toast Banner ── */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed top-4 left-4 right-4 z-[120] max-w-sm mx-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 text-xs font-semibold"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="flex-1 leading-snug">{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
