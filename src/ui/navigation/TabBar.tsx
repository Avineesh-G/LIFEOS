import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralInfinityIcon, SlidersHorizontal } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { MOTION_SPRINGS } from '../tokens/motion';

export type LunaOrbState = 'idle' | 'listening' | 'thinking' | 'unread';

export interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  tint?: string;
  quickActions?: { label: string; action: () => void }[];
  isCustomizable?: boolean;
}

export interface TabBarProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  onAiClick?: () => void;
  onCustomizeSlot?: (slotKey: string) => void;
  lunaState?: LunaOrbState;
  className?: string;
}

/**
 * Pure Apple Liquid Navigation Bar
 * Continuous, sleek, borderless liquid glass capsule with seamlessly integrated Luna AI chat bot.
 */
export function TabBar({
  items,
  activeKey,
  onChange,
  onAiClick,
  onCustomizeSlot,
  lunaState = 'idle',
  className = '',
}: TabBarProps) {
  const [activeMenuTab, setActiveMenuTab] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);

  const handlePressStart = (tab: TabItem) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      triggerHaptic('medium');
      if (tab.isCustomizable && onCustomizeSlot) {
        onCustomizeSlot(tab.key);
      } else if (tab.key === 'home' && onCustomizeSlot) {
        onCustomizeSlot('home');
      } else if (tab.quickActions && tab.quickActions.length > 0) {
        setActiveMenuTab(tab.key);
      }
    }, 380);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTabClick = (tab: TabItem) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    triggerHaptic('selection');
    onChange(tab.key);
  };

  return (
    <div className={`relative flex items-center justify-center pointer-events-auto select-none ${className}`}>
      {/* ── Context Menu on Tab Long-Press ── */}
      <AnimatePresence>
        {activeMenuTab && (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setActiveMenuTab(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 left-4 z-50 p-1.5 rounded-2xl glass-nav nav-rim-light shadow-2xl flex flex-col gap-1 min-w-[160px]"
            >
              {items
                .find((t) => t.key === activeMenuTab)
                ?.quickActions?.map((qa, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      qa.action();
                      setActiveMenuTab(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-left text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Continuous High-Intensity Liquid Glass Navigation Capsule ── */}
      <div className="h-[52px] px-2 rounded-full glass-nav nav-rim-light shadow-2xl flex items-center gap-1 min-w-[280px] max-w-[340px]">
        {/* Navigation Slots (Home, Slot 2, Slot 3) */}
        <div className="flex-1 flex items-center gap-0.5">
          {items.map((tab) => {
            const isSelected = tab.key === activeKey;
            const tint = tab.tint || '#0A84FF';

            return (
              <button
                key={tab.key}
                type="button"
                aria-label={tab.label}
                onMouseDown={() => handlePressStart(tab)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(tab)}
                onTouchEnd={handlePressEnd}
                onTouchCancel={handlePressEnd}
                onClick={() => handleTabClick(tab)}
                className="relative flex-1 min-w-0 h-[42px] rounded-full flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer transition-colors z-10 px-1"
                style={{ color: isSelected ? tint : 'rgba(235, 235, 245, 0.60)' }}
              >
                {/* Icon */}
                <div className="flex items-center justify-center text-[19px] shrink-0">
                  {isSelected ? tab.activeIcon : tab.icon}
                </div>

                {/* Semibold Label */}
                <span className="text-[9.5px] font-semibold tracking-tight truncate leading-none">
                  {tab.label}
                </span>

                {/* Liquid Active Droplet Thumb */}
                {isSelected && (
                  <motion.div
                    layoutId="tabbar-glass-thumb"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 2px 8px rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                    transition={MOTION_SPRINGS.snappy}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle Internal Divider */}
        <div className="w-[1px] h-5 bg-white/10 mx-0.5 shrink-0" />

        {/* ── Integrated Luna AI Chat Bot Slot ── */}
        <motion.button
          type="button"
          aria-label="Ask Luna AI"
          whileTap={{ scale: 0.92 }}
          transition={MOTION_SPRINGS.bouncy}
          onClick={() => {
            triggerHaptic('medium');
            onAiClick?.();
          }}
          className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer select-none shrink-0 bg-white/[0.08] hover:bg-white/[0.14] transition-colors"
        >
          {/* Thinking Rotating Ring */}
          {lunaState === 'thinking' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#BF5AF2] border-r-[#0A84FF]"
            />
          )}

          {/* Listening Waveform Bars */}
          {lunaState === 'listening' ? (
            <div className="flex items-center gap-0.5 h-3.5">
              {[0.4, 0.9, 0.6, 1.0, 0.5].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.3, scale, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-0.5 bg-[#BF5AF2] rounded-full h-full"
                />
              ))}
            </div>
          ) : (
            /* Idle Neural Infinity Loop Icon (Option 3) */
            <div className="relative z-10 flex items-center justify-center">
              <NeuralInfinityIcon
                size={23}
                glow
              />
            </div>
          )}

          {/* Unread Indicator Dot */}
          {lunaState === 'unread' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#BF5AF2] ring-2 ring-black" />
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default TabBar;
