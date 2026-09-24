import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, X, ArrowRight, Bell, Info, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface NotificationBannerData {
  id: string;
  title: string;
  message: string;
  details?: string;
  type?: 'update' | 'info' | 'warning' | 'announcement';
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

interface M3NotificationBannerProps {
  banner?: NotificationBannerData | null;
  onDismiss?: (id: string) => void;
}

/**
 * Material 3 Expressive Expandable Notification Bar
 * Features:
 * - Collapsible / Expandable ("Enlarge" / "Read More") to read full notes
 * - "Close" (X) option to dismiss
 * - Action button for direct flow trigger (e.g. Update Now)
 * - 120 FPS fluid spring layout morphing
 */
export default function M3NotificationBanner({
  banner: propsBanner,
  onDismiss,
}: M3NotificationBannerProps) {
  const [activeBanner, setActiveBanner] = useState<NotificationBannerData | null>(propsBanner || null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync props banner
  useEffect(() => {
    if (propsBanner) {
      setActiveBanner(propsBanner);
      setIsExpanded(false);
    }
  }, [propsBanner]);

  // Also support custom event dispatch across the entire app
  useEffect(() => {
    const handleEvent = (event: any) => {
      if (event?.detail) {
        const dismissedKey = `lifeos_banner_dismissed_${event.detail.id}`;
        if (localStorage.getItem(dismissedKey)) {
          return;
        }
        setActiveBanner(event.detail);
        setIsExpanded(false);
      }
    };

    window.addEventListener('lifeos-show-notification-banner', handleEvent);
    return () => window.removeEventListener('lifeos-show-notification-banner', handleEvent);
  }, []);

  if (!activeBanner) return null;

  const handleClose = () => {
    triggerHaptic('light');
    if (activeBanner.id) {
      try {
        localStorage.setItem(`lifeos_banner_dismissed_${activeBanner.id}`, 'true');
      } catch {
        // storage quota
      }
    }
    if (activeBanner.onClose) {
      activeBanner.onClose();
    }
    if (onDismiss) {
      onDismiss(activeBanner.id);
    }
    setActiveBanner(null);
  };

  const handleToggleExpand = () => {
    triggerHaptic('selection');
    setIsExpanded(prev => !prev);
  };

  const isUpdate = activeBanner.type === 'update' || activeBanner.title.toLowerCase().includes('update');

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="w-full mb-3 select-none"
      >
        <div
          className={`relative overflow-hidden rounded-[24px] border p-3.5 sm:p-4 m3-elevation-1 transition-colors ${
            isUpdate
              ? 'bg-gradient-to-r from-violet-500/10 via-[var(--md-surface-container)] to-indigo-500/10 border-[var(--md-outline-variant)]'
              : 'bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]'
          }`}
        >
          {/* Top Bar: Icon, Title, Enlarge toggle, Close */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className={`w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 ${
                isUpdate ? 'bg-[var(--md-primary)]/15 text-[var(--md-primary)]' : 'bg-black/5 dark:bg-white/10 text-[var(--md-on-surface)]'
              }`}>
                {isUpdate ? <Sparkles size={16} /> : <Bell size={16} />}
              </span>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-[var(--md-on-surface)] truncate">
                  {activeBanner.title}
                </h4>
                {!isExpanded && (
                  <p className="text-[11px] text-[var(--md-on-surface-variant)] truncate mt-0.5">
                    {activeBanner.message}
                  </p>
                )}
              </div>
            </div>

            {/* Actions: Enlarge Button & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {activeBanner.details && (
                <button
                  onClick={handleToggleExpand}
                  className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title={isExpanded ? 'Collapse' : 'Enlarge to read new features'}
                >
                  <span>{isExpanded ? 'Less' : 'Read More'}</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}

              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-all"
                title="Close notification"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Expanded Content Section (Smoothly slides/reveals with 120 FPS spring) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden mt-3 pt-3 border-t border-[var(--md-outline-variant)]/60"
              >
                <p className="text-xs text-[var(--md-on-surface-variant)] font-medium leading-relaxed mb-2.5">
                  {activeBanner.message}
                </p>

                {activeBanner.details && (
                  <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-[18px] p-3 border border-[var(--md-outline-variant)]/40 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-primary)] mb-1.5 font-tag">
                      Details & Release Notes
                    </p>
                    <div className="text-xs text-[var(--md-on-surface)] whitespace-pre-line leading-relaxed font-sans">
                      {activeBanner.details}
                    </div>
                  </div>
                )}

                {/* Primary Action Button (if provided) */}
                {activeBanner.actionLabel && activeBanner.onAction && (
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        activeBanner.onAction!();
                      }}
                      className="px-4 py-2 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-96 transition-all"
                    >
                      <span>{activeBanner.actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
