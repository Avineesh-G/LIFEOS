import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LucideIcon } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { MotionScheme } from '../../utils/motionConfig';

export interface FloatingToolbarAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
}

export interface M3FloatingToolbarProps {
  isVisible: boolean;
  selectedCount: number;
  onClearSelection?: () => void;
  actions: FloatingToolbarAction[];
  className?: string;
}

/**
 * Material 3 Expressive Floating Toolbar.
 * Contextual action pill appearing on item selection (To-Do / Timetable).
 */
export function M3FloatingToolbar({
  isVisible,
  selectedCount,
  onClearSelection,
  actions,
  className = '',
}: M3FloatingToolbarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={MotionScheme.expressive}
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full m3-elevation-3 bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] select-none shadow-xl ${className}`}
          >
            {/* Selected Count Indicator */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-[var(--md-outline-variant)]">
              {onClearSelection && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onClearSelection();
                  }}
                  className="w-6 h-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                  title="Clear selection"
                >
                  <X size={14} />
                </button>
              )}
              <span className="text-xs font-bold font-stat px-1.5 py-0.5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)]">
                {selectedCount}
              </span>
              <span className="text-[11px] font-medium text-[var(--md-on-surface-variant)]">
                selected
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 pl-1">
              {actions.map((action) => {
                const Icon = action.icon;
                const isDanger = action.variant === 'danger';
                const isPrimary = action.variant === 'primary';

                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      triggerHaptic(isDanger ? 'heavy' : 'light');
                      action.onClick();
                    }}
                    title={action.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      isDanger
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                        : isPrimary
                        ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                        : 'hover:bg-black/5 dark:hover:bg-white/10 text-[var(--md-on-surface)]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default M3FloatingToolbar;
