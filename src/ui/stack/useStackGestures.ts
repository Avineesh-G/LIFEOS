/**
 * LifeOS — Gesture physics, velocity calculation, and responsive sizing hook
 * Supports touch, pointer, and keyboard navigation with zero layout reflows.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { MOTION_SPRINGS } from '../tokens/motion';

interface UseStackGesturesOptions {
  itemCount: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  peekWidth?: number;
  cardGap?: number;
  maxCardWidth?: number;
}

export function useStackGestures({
  itemCount,
  initialIndex = 0,
  onIndexChange,
  peekWidth = 24,
  cardGap = 14,
  maxCardWidth = 440,
}: UseStackGesturesOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(360);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const prefersReducedMotion = useReducedMotion();

  // Drag state refs
  const isDraggingRef = useRef<boolean>(false);
  const dragStartOffsetRef = useRef<number>(0);
  const suppressClickTimeoutRef = useRef<any>(null);

  // Sync internal index if external initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < itemCount && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, itemCount]);

  // Responsive container measurement
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    measure();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute card geometry
  // Card width fits viewport minus peek and gap on both sides, clamped to maxCardWidth
  const rawCardWidth = containerWidth - (peekWidth * 2) - (cardGap * 2);
  const cardWidth = Math.max(260, Math.min(rawCardWidth, maxCardWidth));
  const step = cardWidth + cardGap;
  const sideInset = Math.max(0, (containerWidth - cardWidth) / 2);

  // Target targetX drives the spring
  const targetX = useMotionValue(-currentIndex * step);
  const springX = useSpring(targetX, prefersReducedMotion ? { duration: 0.1 } : {
    stiffness: 380,
    damping: 34,
    mass: 1,
  });

  // Keep spring in sync when currentIndex changes
  useEffect(() => {
    targetX.set(-currentIndex * step);
  }, [currentIndex, step, targetX]);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(itemCount - 1, index));
      setCurrentIndex(clamped);
      targetX.set(-clamped * step);
      onIndexChange?.(clamped);
    },
    [itemCount, onIndexChange, step, targetX]
  );

  const next = useCallback(() => {
    if (currentIndex < itemCount - 1) {
      goToIndex(currentIndex + 1);
    }
  }, [currentIndex, itemCount, goToIndex]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  }, [currentIndex, goToIndex]);

  // Handle Drag Gesture Events
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    dragStartOffsetRef.current = targetX.get();
  }, [targetX]);

  const handleDragEnd = useCallback(
    (_event: any, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;
      const threshold = cardWidth * 0.28; // 28% drag threshold

      let targetIndex = currentIndex;

      // Fast flick swipe (velocity-aware)
      if (Math.abs(velocityX) > 400) {
        if (velocityX < 0 && currentIndex < itemCount - 1) {
          targetIndex = currentIndex + 1;
        } else if (velocityX > 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        }
      } else {
        // Slow distance-based drag
        if (offsetX < -threshold && currentIndex < itemCount - 1) {
          targetIndex = currentIndex + 1;
        } else if (offsetX > threshold && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        }
      }

      goToIndex(targetIndex);

      // Keep isDraggingRef true for a tiny window to prevent click event bleed
      if (suppressClickTimeoutRef.current) {
        clearTimeout(suppressClickTimeoutRef.current);
      }
      suppressClickTimeoutRef.current = setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    },
    [cardWidth, currentIndex, goToIndex, itemCount]
  );

  return {
    containerRef,
    containerWidth,
    cardWidth,
    cardGap,
    step,
    sideInset,
    currentIndex,
    springX,
    targetX,
    isDraggingRef,
    goToIndex,
    next,
    prev,
    handleDragStart,
    handleDragEnd,
  };
}
