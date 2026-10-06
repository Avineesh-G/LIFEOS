import React from 'react';
import { motion } from 'framer-motion';
import { MOTION_SPRINGS } from '../tokens/motion';

export interface BadgeProps {
  count?: number | string;
  label?: string;
  points?: 8 | 12;
  color?: string;
  className?: string;
}

export function Badge({
  count,
  label,
  points = 12,
  color = '#FF7A45',
  className = '',
}: BadgeProps) {
  // SVG scalloped star polygon
  const path =
    points === 12
      ? 'M12 2L14.5 4.5L18 4L18.5 7.5L22 9L20.5 12.5L22 16L18.5 17.5L18 21L14.5 20.5L12 23L9.5 20.5L6 21L5.5 17.5L2 16L3.5 12.5L2 9L5.5 7.5L6 4L9.5 4.5L12 2Z'
      : 'M12 2L15 6L20 6L18 11L22 15L17 17L16 22L12 19L8 22L7 17L2 15L6 11L4 6L9 6L12 2Z';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={MOTION_SPRINGS.bouncy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold select-none ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.14)',
        color,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-current shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={path} />
      </svg>
      {count !== undefined && <span className="tabular-nums">{count}</span>}
      {label && <span>{label}</span>}
    </motion.div>
  );
}
