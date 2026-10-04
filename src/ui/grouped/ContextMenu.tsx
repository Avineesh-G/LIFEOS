import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { GlassSurface } from '../glass/GlassSurface';
import { MOTION_SPRINGS } from '../tokens/motion';

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  className?: string;
}

export function ContextMenu({ items, children, className = '' }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      triggerHaptic('medium');
      setIsOpen(true);
    }, 450);
  };

  const handlePointerUpOrLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
    >
      <motion.div
        animate={isOpen ? { scale: 1.03 } : { scale: 1 }}
        transition={MOTION_SPRINGS.snappy}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Dismiss */}
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Floating Glass Menu */}
            <GlassSurface
              as={motion.div}
              initial={{ opacity: 0, scale: 0.85, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={MOTION_SPRINGS.snappy}
              className="absolute top-full left-0 mt-2 min-w-[200px] z-50 rounded-[20px] p-1.5 shadow-2xl flex flex-col gap-0.5"
            >
              {items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(it.destructive ? 'error' : 'light');
                    setIsOpen(false);
                    it.onClick();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-[12px] flex items-center justify-between text-sm font-medium transition-colors select-none ${
                    it.destructive
                      ? 'text-[#FF453A] hover:bg-[#FF453A]/15'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span>{it.label}</span>
                  {it.icon && <span className="text-base shrink-0">{it.icon}</span>}
                </button>
              ))}
            </GlassSurface>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
