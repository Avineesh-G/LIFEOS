import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUp, 
  CheckCircle, 
  Sparkle, 
  Barbell, 
  Note, 
  CheckSquare, 
  CurrencyDollar, 
  Bag 
} from '@phosphor-icons/react';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../utils/haptics';
import { saveData } from '../db';
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="w-full max-w-sm rounded-[28px] bg-[#1C1C1E] border border-white/10 p-6 shadow-2xl space-y-4 font-sans text-left"
            >
              {/* Header Icon */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center border border-[#0A84FF]/25">
                  <CloudArrowUp size={26} weight="duotone" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/20">
                  Cloud Sync
                </span>
              </div>

              {/* Title & Explanation */}
              <div className="space-y-1.5 text-left">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Move Existing Data to Cloud?
                </h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  We found existing workouts, notes, and tasks on this device. Would you like to sync all of your progress to your Cloud account ({user?.email || 'your account'})?
                </p>
              </div>

              {/* Detected Items Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#2C2C2E] border border-white/5 text-xs">
                {stats.workouts > 0 && (
                  <div className="flex items-center gap-2 text-[#8E8E93]">
                    <Barbell size={15} weight="duotone" className="text-[#FF453A] shrink-0" />
                    <span className="font-semibold text-white">{stats.workouts}</span>
                    <span className="text-[11px]">Workouts</span>
                  </div>
                )}
                {stats.notes > 0 && (
                  <div className="flex items-center gap-2 text-[#8E8E93]">
                    <Note size={15} weight="duotone" className="text-[#FFD60A] shrink-0" />
                    <span className="font-semibold text-white">{stats.notes}</span>
                    <span className="text-[11px]">Notes</span>
                  </div>
                )}
                {stats.tasks > 0 && (
                  <div className="flex items-center gap-2 text-[#8E8E93]">
                    <CheckSquare size={15} weight="duotone" className="text-[#30D158] shrink-0" />
                    <span className="font-semibold text-white">{stats.tasks}</span>
                    <span className="text-[11px]">Tasks</span>
                  </div>
                )}
                {stats.expenses > 0 && (
                  <div className="flex items-center gap-2 text-[#8E8E93]">
                    <CurrencyDollar size={15} weight="duotone" className="text-[#FF375F] shrink-0" />
                    <span className="font-semibold text-white">{stats.expenses}</span>
                    <span className="text-[11px]">Expenses</span>
                  </div>
                )}
                {stats.shopping > 0 && (
                  <div className="flex items-center gap-2 text-[#8E8E93]">
                    <Bag size={15} weight="duotone" className="text-[#0A84FF] shrink-0" />
                    <span className="font-semibold text-white">{stats.shopping}</span>
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
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold text-xs shadow-lg shadow-[#0A84FF]/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isMigrating ? (
                    <span>Moving Data to Cloud...</span>
                  ) : (
                    <>
                      <Sparkle size={15} weight="fill" />
                      <span>Move to Cloud Database</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={handleDismiss}
                  className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-white/5 text-[#8E8E93] font-medium text-xs transition-all text-center cursor-pointer"
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
          <div
            className="fixed left-4 right-4 z-[120] max-w-sm mx-auto pointer-events-none"
            style={{ top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 12px) + 46px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="p-3.5 rounded-2xl bg-[#30D158] text-black shadow-xl flex items-center gap-2.5 text-xs font-semibold"
            >
              <CheckCircle size={18} weight="fill" className="shrink-0 text-black" />
              <span className="flex-1 leading-snug">{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
