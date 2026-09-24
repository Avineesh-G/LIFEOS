import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, CloudOff, CheckCircle2, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { registerDismissible } from '../utils/backNavigation';

export default function NetworkStatusModal() {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [showModal, setShowModal] = useState(false);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  // Back button dismissible overlay registration
  useEffect(() => {
    if (showModal) {
      return registerDismissible('network-status-modal', () => {
        setShowModal(false);
      });
    }
  }, [showModal]);

  useEffect(() => {
    // Check initial state on mount
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setShowModal(true);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowModal(true);
      setShowReconnectedToast(false);
      triggerHaptic('medium');
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowModal(false);
      setShowReconnectedToast(true);
      triggerHaptic('success');
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <>
      {/* ── Offline Pop-up Modal on Entering App without Internet ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm rounded-3xl bg-[var(--card-surface)] border border-amber-500/30 p-6 shadow-2xl text-center space-y-4"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
                <WifiOff size={28} className="animate-pulse" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-primary-light dark:text-primary-dark">
                  No Internet Connection
                </h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  You are currently offline. LifeOS is running smoothly from your device’s local storage.
                </p>
                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-700 dark:text-amber-300 font-medium text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CloudOff size={13} className="flex-shrink-0" />
                    <span>Offline Mode Active</span>
                  </div>
                  <p className="text-secondary-light/80 dark:text-secondary-dark/80 text-[10.5px]">
                    You can continue reading and updating your timetable, notes, tasks, and workouts. Changes will automatically sync to Cloud Firestore when you're back online.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowModal(false);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
                >
                  Continue in Offline Mode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Persistent Subtle Status Bar Indicator When Offline (If modal was dismissed) ── */}
      <AnimatePresence>
        {isOffline && !showModal && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            onClick={() => setShowModal(true)}
            style={{
              top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 12px) + 46px)',
            }}
            className="fixed left-1/2 -translate-x-1/2 z-[90] px-3.5 py-1.5 rounded-full bg-amber-500/95 text-white text-[11px] font-bold shadow-lg shadow-amber-500/25 backdrop-blur-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform border border-amber-400/30 select-none"
          >
            <WifiOff size={12} />
            <span>Offline Mode</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reconnected Toast When Internet Comes Back ── */}
      <AnimatePresence>
        {showReconnectedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 12px) + 46px)',
            }}
            className="fixed left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl shadow-emerald-600/30 flex items-center gap-2 border border-emerald-400/30 max-w-[92vw] select-none"
          >
            <CheckCircle2 size={15} className="shrink-0" />
            <span className="truncate">Back Online — Connected to Cloud</span>
            <button
              type="button"
              onClick={() => setShowReconnectedToast(false)}
              className="ml-1 p-0.5 hover:bg-white/20 rounded-full shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
