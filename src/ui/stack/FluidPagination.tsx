/**
 * LifeOS — Fluid Pagination Indicator
 * Features elastic spring-animated active pill, tap-to-jump affordance,
 * and compact rendering for collections.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { MOTION_SPRINGS } from '../tokens/motion';

interface FluidPaginationProps {
  total: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  tint?: string;
  className?: string;
}

export function FluidPagination({
  total,
  currentIndex,
  onSelect,
  tint = '#40C8E0',
  className = '',
}: FluidPaginationProps) {
  if (total <= 1) return null;

  // For long collections (> 8 items), clamp visible range around current index
  const MAX_VISIBLE_DOTS = 8;
  const isCapped = total > MAX_VISIBLE_DOTS;

  let start = 0;
  let end = total;

  if (isCapped) {
    const half = Math.floor(MAX_VISIBLE_DOTS / 2);
    start = Math.max(0, Math.min(total - MAX_VISIBLE_DOTS, currentIndex - half));
    end = start + MAX_VISIBLE_DOTS;
  }

  const visibleIndices: number[] = [];
  for (let i = start; i < end; i++) {
    visibleIndices.push(i);
  }

  return (
    <nav
      aria-label="Carousel pagination"
      className={`flex items-center justify-center gap-1.5 py-2 select-none ${className}`}
    >
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]"
        role="tablist"
      >
        {visibleIndices.map((idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Slide ${idx + 1} of ${total}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                triggerHaptic('selection');
                onSelect(idx);
              }}
              className="relative p-1 focus:outline-none rounded-full"
            >
              {/* Resting dot background */}
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isActive ? 'opacity-0' : 'bg-white/30 hover:bg-white/50'
                }`}
              />

              {/* Active Morphing Pill */}
              {isActive && (
                <motion.div
                  layoutId="fluid-active-pill"
                  className="absolute inset-y-1 inset-x-0 w-5 h-2 rounded-full"
                  style={{ backgroundColor: tint }}
                  transition={MOTION_SPRINGS.snappy}
                />
              )}
            </button>
          );
        })}
      </div>

      <span className="sr-only">
        Item {currentIndex + 1} of {total}
      </span>
    </nav>
  );
}
