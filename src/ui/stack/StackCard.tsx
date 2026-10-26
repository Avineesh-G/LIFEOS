/**
 * LifeOS — StackCard Component
 * Implements GPU-accelerated 3D perspective, scale interpolation,
 * inward rotation near edges, and drag-click suppression.
 * Zero layout reflows per AGENTS.md stability rules.
 */

import React from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import type { StackAnimationConfig } from './types';

interface StackCardProps {
  index: number;
  cardWidth: number;
  cardGap: number;
  springX: MotionValue<number>;
  isActive: boolean;
  isAdjacent: boolean;
  isDraggingRef: React.RefObject<boolean>;
  animationConfig: StackAnimationConfig;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function StackCard({
  index,
  cardWidth,
  cardGap,
  springX,
  isActive,
  isAdjacent,
  isDraggingRef,
  animationConfig,
  onClick,
  children,
  className = '',
}: StackCardProps) {
  const step = cardWidth + cardGap;
  const centerPos = -index * step;

  // Scale: 1.0 (center) -> 0.93 (adjacent) -> 0.85 (distant)
  const scale = useTransform(springX, (x) => {
    const dist = Math.abs((x - centerPos) / step);
    if (dist <= 1) {
      return 1 - dist * (1 - animationConfig.adjacentScale);
    }
    return Math.max(
      animationConfig.distantScale,
      animationConfig.adjacentScale - (dist - 1) * (animationConfig.adjacentScale - animationConfig.distantScale)
    );
  });

  // RotateY: subtle 3D rotation inward toward viewport center
  const rotateY = useTransform(springX, (x) => {
    const norm = (x - centerPos) / step;
    const clamped = Math.max(-1.5, Math.min(1.5, norm));
    return clamped * animationConfig.maxRotationDeg;
  });

  // Opacity: 1.0 (center) -> 0.82 (adjacent) -> 0.40 (distant)
  const opacity = useTransform(springX, (x) => {
    const dist = Math.abs((x - centerPos) / step);
    if (dist <= 1) {
      return 1 - dist * (1 - animationConfig.adjacentOpacity);
    }
    return Math.max(
      animationConfig.distantOpacity,
      animationConfig.adjacentOpacity - (dist - 1) * (animationConfig.adjacentOpacity - animationConfig.distantOpacity)
    );
  });

  // zIndex: ensures active card stays above adjacent cards
  const zIndex = useTransform(springX, (x) => {
    const dist = Math.abs((x - centerPos) / step);
    return Math.max(1, Math.round(50 - dist * 10));
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      style={{
        width: cardWidth,
        scale,
        rotateY,
        opacity,
        zIndex,
        transformOrigin: 'center center',
      }}
      className={`shrink-0 select-none relative ${className}`}
      onClick={handleClick}
      aria-hidden={!isActive && !isAdjacent}
    >
      {children}
    </motion.div>
  );
}
