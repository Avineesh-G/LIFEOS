import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassSurface } from '../glass/GlassSurface';
import { MOTION_SPRINGS } from '../tokens/motion';

export interface ToastProps {
  id: string;
  icon?: React.ReactNode;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  id,
  icon,
  message,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  return (
    <div className="fixed top-3 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <GlassSurface
        as={motion.div}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={MOTION_SPRINGS.snappy}
        drag="y"
        dragConstraints={{ top: -50, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -20) onDismiss();
        }}
        className="pointer-events-auto px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-xl select-none"
      >
        {icon && <span className="text-white text-base shrink-0">{icon}</span>}
        <span className="text-[14px] font-semibold text-white tracking-tight">{message}</span>
      </GlassSurface>
    </div>
  );
}
