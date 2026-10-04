import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiSlash, CloudSlash, CheckCircle, X } from '../ui/tokens/icons';
import { GlassSurface } from '../ui/glass/GlassSurface';
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
      triggerHaptic('selection');
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
      {/* ── Offline Pop-up Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm rounded-[32px] bg-[#1C1C1E] border border-amber-500/30 p-6 shadow-2xl text-center space-y-4"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-[18px] bg-amber-500/15 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                <WifiSlash size={28} weight="bold" className="animate-pulse" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  No Internet Connection
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  You are currently offline. LifeOS is running smoothly from your device's local storage.
                </p>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CloudSlash size={14} weight="bold" className="shrink-0" />
                    <span>Offline Storage Active</span>
                  </div>
                  <p className="text-white/60 text-[10.5px] leading-relaxed">
                    You can continue logging workouts, checking timetable, and updating tasks. Changes will automatically sync to Cloud Firestore once you are back online.
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
                  className="w-full py-3.5 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg active:scale-95 transition-transform cursor-pointer"
                >
                  Continue in Offline Mode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reconnected Toast ── */}
      <AnimatePresence>
        {showReconnectedToast && (
          <div
            style={{
              top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 48px)',
            }}
            className="fixed inset-x-4 z-[100] flex justify-center pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className="pointer-events-auto px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-emerald-400/30 max-w-full select-none"
            >
              <CheckCircle size={16} weight="fill" className="shrink-0 text-white" />
              <span className="truncate">Back Online — Connected to Cloud</span>
              <button
                type="button"
                onClick={() => setShowReconnectedToast(false)}
                className="ml-1 p-0.5 hover:bg-white/20 rounded-full shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X size={13} weight="bold" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
