import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LunaComicBubbleIcon } from '../tokens/icons';
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
 * Features a physics-grounded Hold & Drag fluid droplet gesture with 120Hz responsive tracking,
 * tactile slot-boundary haptics, and seamless integration with Luna AI.
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
  const [optimisticKey, setOptimisticKey] = useState<string | null>(null);
  
  // Hold & Drag Gesture State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastHapticIndexRef = useRef<number>(-1);

  // Sync optimistic key back when parent activeKey updates
  useEffect(() => {
    setOptimisticKey(null);
  }, [activeKey]);

  const activeIndex = Math.max(0, items.findIndex((t) => t.key === (optimisticKey || activeKey)));
  const currentKey = optimisticKey || activeKey;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const calculateSlotFromCoord = useCallback((clientX: number): { index: number; offsetPx: number } => {
    if (!trackRef.current) return { index: activeIndex, offsetPx: 0 };
    const rect = trackRef.current.getBoundingClientRect();
    const trackWidth = rect.width;
    const tabCount = Math.max(1, items.length);
    const tabWidth = trackWidth / tabCount;
    
    // Relative X clamped within track bounds
    const relX = Math.max(0, Math.min(trackWidth, clientX - rect.left));
    const targetIndex = Math.min(tabCount - 1, Math.max(0, Math.floor(relX / tabWidth)));
    
    // Calculate droplet X position centered on finger or clamped
    const dropletLeft = Math.max(0, Math.min(trackWidth - tabWidth, relX - tabWidth / 2));
    
    return { index: targetIndex, offsetPx: dropletLeft };
  }, [items.length, activeIndex]);

  // Touch & Pointer Handlers for Hold & Drag Gesture
  const handlePointerStart = (clientX: number, clientY: number, tab?: TabItem) => {
    isLongPressRef.current = false;
    isDraggingRef.current = false;
    touchStartPosRef.current = { x: clientX, y: clientY };
    lastHapticIndexRef.current = activeIndex;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Long-press timer for slot customization (if user holds without dragging)
    longPressTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        isLongPressRef.current = true;
        triggerHaptic('medium');
        if (tab?.isCustomizable && onCustomizeSlot) {
          onCustomizeSlot(tab.key);
        } else if (tab?.key === 'home' && onCustomizeSlot) {
          onCustomizeSlot('home');
        } else if (tab?.quickActions && tab.quickActions.length > 0) {
          setActiveMenuTab(tab.key);
        }
      }
    }, 600);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!touchStartPosRef.current) return;
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);

    // If movement exceeds threshold, cancel long press and engage fluid droplet drag
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!isDraggingRef.current && dx > 8) {
        isDraggingRef.current = true;
        setIsDragging(true);
        triggerHaptic('medium');
      }

      if (isDraggingRef.current) {
        const { index, offsetPx } = calculateSlotFromCoord(clientX);
        setDragOffsetPx(offsetPx);
        setDragHoverIndex(index);

        // Tactile boundary crossing haptics
        if (index !== lastHapticIndexRef.current) {
          lastHapticIndexRef.current = index;
          triggerHaptic('medium');
          setOptimisticKey(items[index].key);
        }
      }
    }
  };

  const handlePointerEnd = (clientX?: number) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingRef.current && clientX !== undefined) {
      const { index } = calculateSlotFromCoord(clientX);
      triggerHaptic('medium');
      const targetTab = items[index];
      if (targetTab) {
        setOptimisticKey(targetTab.key);
        onChange(targetTab.key);
      }
    }

    touchStartPosRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragHoverIndex(null);
  };

  const handleTabClick = (tab: TabItem) => {
    if (isLongPressRef.current || isDraggingRef.current) {
      isLongPressRef.current = false;
      return;
    }
    triggerHaptic('medium');
    setOptimisticKey(tab.key);
    onChange(tab.key);
  };

  const tabWidthPercent = 100 / Math.max(1, items.length);

  return (
    <div className={`relative flex items-center justify-center pointer-events-auto select-none gap-2.5 ${className}`}>
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
                      triggerHaptic('medium');
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

      {/* ── High-Intensity Liquid Glass Navigation Capsule with Fluid Drag Tracking ── */}
      <div
        className="h-[52px] px-2.5 rounded-full glass-nav nav-rim-light shadow-2xl flex items-center min-w-[210px] max-w-[275px] touch-none cursor-pointer"
        onMouseMove={(e) => isDraggingRef.current && handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={(e) => handlePointerEnd(e.clientX)}
        onMouseLeave={() => isDraggingRef.current && handlePointerEnd()}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) handlePointerMove(t.clientX, t.clientY);
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          handlePointerEnd(t?.clientX);
        }}
        onTouchCancel={() => handlePointerEnd()}
      >
        {/* Navigation Slots (Home, Slot 2, Slot 3) */}
        <div ref={trackRef} className="flex-1 flex items-center relative h-[42px]">
          {/* Fluid Hold & Drag Droplet Pill */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none rounded-full z-0 will-change-transform"
            style={{
              width: `${tabWidthPercent}%`,
              transform: isDragging
                ? `translate3d(${dragOffsetPx}px, 0, 0) scale(1.05)`
                : `translate3d(${activeIndex * 100}%, 0, 0) scale(1)`,
              transition: isDragging
                ? 'scale 0.15s ease'
                : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), scale 0.2s ease',
              background: isDragging
                ? 'radial-gradient(ellipse 95% 70% at 50% 0%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.08) 65%, transparent 95%), rgba(255, 255, 255, 0.14)'
                : 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 60%, transparent 90%), rgba(255, 255, 255, 0.08)',
              boxShadow: isDragging
                ? '0 8px 24px rgba(0, 0, 0, 0.75), inset 0 1px 2px rgba(255, 255, 255, 0.25)'
                : '0 4px 14px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            }}
          />

          {items.map((tab, idx) => {
            const isSelected = isDragging ? dragHoverIndex === idx : tab.key === currentKey;
            const tint = tab.tint || '#0A84FF';

            return (
              <button
                key={tab.key}
                type="button"
                aria-label={tab.label}
                onMouseDown={(e) => handlePointerStart(e.clientX, e.clientY, tab)}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (t) handlePointerStart(t.clientX, t.clientY, tab);
                }}
                onClick={() => handleTabClick(tab)}
                className="relative flex-1 min-w-0 h-[42px] rounded-full flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer transition-colors z-10 px-1 touch-manipulation"
                style={{ color: isSelected ? tint : 'rgba(235, 235, 245, 0.60)' }}
              >
                {/* Icon with smooth scale micro-interaction */}
                <div
                  className="flex items-center justify-center text-[19px] shrink-0 transition-transform duration-150"
                  style={{ transform: isSelected ? 'scale(1.08)' : 'scale(1)' }}
                >
                  {isSelected ? tab.activeIcon : tab.icon}
                </div>

                {/* Semibold Label */}
                <span className="text-[9.5px] font-semibold tracking-tight truncate leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Separate Standalone Luna AI Floating Icon Bar ── */}
      {onAiClick && (
        <motion.button
          type="button"
          aria-label="Ask Luna AI"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          transition={MOTION_SPRINGS.bouncy}
          onClick={() => {
            triggerHaptic('medium');
            onAiClick();
          }}
          className="relative h-[52px] w-[52px] rounded-full glass-nav nav-rim-light shadow-2xl flex items-center justify-center cursor-pointer select-none shrink-0"
        >
          {/* Thinking Rotating Ring */}
          {lunaState === 'thinking' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full border-2 border-transparent border-t-white border-r-white/40"
            />
          )}

          {/* Listening Waveform Bars */}
          {lunaState === 'listening' ? (
            <div className="flex items-center gap-0.5 h-4">
              {[0.4, 0.9, 0.6, 1.0, 0.5].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.3, scale, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="w-0.5 bg-white rounded-full h-full"
                />
              ))}
            </div>
          ) : (
            /* Idle Luna Comic Bubble Icon - Clean normal white */
            <div className="relative z-10 flex items-center justify-center text-white/90">
              <LunaComicBubbleIcon size={22} />
            </div>
          )}

          {/* Unread Indicator Dot */}
          {lunaState === 'unread' && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white ring-2 ring-black" />
          )}
        </motion.button>
      )}
    </div>
  );
}

export default TabBar;
