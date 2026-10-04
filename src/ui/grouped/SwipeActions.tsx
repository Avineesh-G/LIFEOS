import React, { useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface SwipeActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export interface SwipeActionsProps {
  actions: SwipeActionItem[];
  children: React.ReactNode;
  className?: string;
}

export function SwipeActions({
  actions,
  children,
  className = '',
}: SwipeActionsProps) {
  const [offset, setOffset] = useState(0);
  const controls = useAnimation();
  const maxReveal = actions.length * 68;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const x = info.offset.x;
    if (x < -180 && actions.length > 0) {
      // Full swipe triggers primary action
      triggerHaptic('success');
      actions[0].onClick();
      controls.start({ x: 0 });
      setOffset(0);
    } else if (x < -40) {
      // Snap open actions
      triggerHaptic('selection');
      controls.start({ x: -maxReveal });
      setOffset(-maxReveal);
    } else {
      // Snap closed
      controls.start({ x: 0 });
      setOffset(0);
    }
  };

  return (
    <div className={`relative overflow-hidden w-full select-none ${className}`}>
      {/* Background action buttons */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {actions.map((act) => (
          <button
            key={act.key}
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              act.onClick();
              controls.start({ x: 0 });
              setOffset(0);
            }}
            className="w-[68px] flex flex-col items-center justify-center gap-1 text-white font-medium text-xs transition-opacity active:opacity-80"
            style={{ backgroundColor: act.color }}
          >
            <span className="text-lg">{act.icon}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>

      {/* Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -maxReveal, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={controls}
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        className="relative bg-[#1C1C1E] z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
