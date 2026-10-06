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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="w-full max-w-sm rounded-[32px] bg-[#141416] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.95)] text-center space-y-4"
            >
              {/* Icon (Droplet Glass Container + Amber Icon) */}
              <div className="w-14 h-14 rounded-2xl glass-tile text-[#FF9F0A] mx-auto flex items-center justify-center">
                <WifiSlash size={28} weight="bold" className="animate-pulse" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-[19px] font-bold text-white tracking-tight">
                  No Internet Connection
                </h3>
                <p className="text-[13px] text-white/60 leading-relaxed">
                  You are currently offline. LifeOS is running smoothly from your device's local storage.
                </p>

                {/* Sub-card (Pure Water Droplet Glass Effect) */}
                <div className="p-3.5 rounded-2xl glass-tile text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-[#FF9F0A] text-[13px] font-semibold">
                    <CloudSlash size={16} weight="bold" className="shrink-0" />
                    <span>Offline Storage Active</span>
                  </div>
                  <p className="text-white/65 text-[12px] leading-relaxed">
                    You can continue logging workouts, checking timetable, and updating tasks. Changes will automatically sync to Cloud Firestore once you are back online.
                  </p>
                </div>
              </div>

              {/* Action Button (Liquid Glass Droplet Button) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowModal(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl glass-tile hover:bg-white/[0.12] active:bg-white/[0.18] text-[#FF9F0A] hover:text-[#FFB340] font-bold text-[14px] active:scale-98 transition-all cursor-pointer select-none"
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
              className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-[#141416]/95 glass-tile text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 max-w-full select-none"
            >
              <CheckCircle size={17} weight="fill" className="shrink-0 text-[#30D158]" />
              <span className="truncate text-white/90">Back Online — Connected to Cloud</span>
              <button
                type="button"
                onClick={() => setShowReconnectedToast(false)}
                className="ml-1 p-1 hover:bg-white/10 rounded-full shrink-0 cursor-pointer text-white/40 hover:text-white transition-colors"
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
