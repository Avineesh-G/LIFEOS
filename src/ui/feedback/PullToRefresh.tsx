import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowClockwise } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';

export interface PullToRefreshProps {
  onRefresh: () => Promise<any>;
  children: React.ReactNode;
  threshold?: number;
  tint?: string;
  className?: string;
}

/**
 * Liquid Glass v2 PullToRefresh:
 * Spring-based pull down indicator at scroll top with threshold haptic.
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 64,
  tint = '#0A84FF',
  className = '',
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const passedThresholdRef = useRef(false);

  const rotate = useTransform(pullY, [0, threshold], [0, 360]);
  const opacity = useTransform(pullY, [0, threshold / 2, threshold], [0, 0.6, 1]);
  const scale = useTransform(pullY, [0, threshold], [0.6, 1]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      passedThresholdRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && window.scrollY <= 0) {
      // Damped pull distance
      const damped = Math.min(diff * 0.45, threshold * 1.5);
      pullY.set(damped);

      if (damped >= threshold && !passedThresholdRef.current) {
        passedThresholdRef.current = true;
        triggerHaptic('light');
      } else if (damped < threshold && passedThresholdRef.current) {
        passedThresholdRef.current = false;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullY.get() >= threshold && !refreshing) {
      setRefreshing(true);
      pullY.set(threshold * 0.8);
      triggerHaptic('medium');
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        pullY.set(0);
      }
    } else {
      pullY.set(0);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${className}`}
    >
      {/* Spring Refresh Ring */}
      <motion.div
        style={{
          y: pullY,
          opacity: refreshing ? 1 : opacity,
          scale: refreshing ? 1 : scale,
        }}
        className="absolute top-2 inset-x-0 mx-auto w-10 h-10 rounded-full glass-nav nav-rim-light flex items-center justify-center z-40 pointer-events-none shadow-lg"
      >
        <motion.div
          style={{ rotate: refreshing ? undefined : rotate }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={
            refreshing
              ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
              : undefined
          }
          className="flex items-center justify-center"
        >
          <ArrowClockwise size={20} weight="bold" style={{ color: tint }} />
        </motion.div>
      </motion.div>

      {/* Main Page Content */}
      <motion.div style={{ y: refreshing ? threshold * 0.6 : useTransform(pullY, (v) => v * 0.4) }}>
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
