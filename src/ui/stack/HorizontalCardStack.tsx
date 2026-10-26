/**
 * LifeOS — HorizontalCardStack Component
 * Flagship horizontal card carousel with responsive peeking,
 * velocity-aware physics, inward perspective, and fluid pagination.
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { StackItem, HorizontalCardStackProps, StackAnimationConfig } from './types';
import { useStackGestures } from './useStackGestures';
import { StackCard } from './StackCard';
import { FluidPagination } from './FluidPagination';
import { triggerHaptic } from '../../utils/haptics';
import { MOTION_SPRINGS } from '../tokens/motion';

const DEFAULT_ANIMATION_CONFIG: StackAnimationConfig = {
  activeScale: 1.0,
  adjacentScale: 0.93,
  distantScale: 0.85,
  maxRotationDeg: 3.5,
  adjacentOpacity: 0.85,
  distantOpacity: 0.35,
  perspective: 1000,
  spring: MOTION_SPRINGS.snappy,
};

export function HorizontalCardStack<T extends StackItem = StackItem>({
  items,
  activeIndex = 0,
  onIndexChange,
  renderCard,
  keyExtractor,
  onCardClick,
  peekWidth = 24,
  cardGap = 14,
  className = '',
  showPagination = true,
  tint = '#40C8E0',
  ariaLabel = 'Card carousel',
}: HorizontalCardStackProps<T>) {
  const {
    containerRef,
    cardWidth,
    step,
    sideInset,
    currentIndex,
    springX,
    isDraggingRef,
    goToIndex,
    next,
    prev,
    handleDragStart,
    handleDragEnd,
  } = useStackGestures({
    itemCount: items.length,
    initialIndex: activeIndex,
    onIndexChange,
    peekWidth,
    cardGap,
  });

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerHaptic('selection');
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerHaptic('selection');
        prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        triggerHaptic('selection');
        goToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        triggerHaptic('selection');
        goToIndex(items.length - 1);
      }
    },
    [goToIndex, items.length, next, prev]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none outline-none ${className}`}
      style={{ perspective: `${DEFAULT_ANIMATION_CONFIG.perspective}px` }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Draggable Track */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: -(items.length - 1) * step,
          right: 0,
        }}
        dragElastic={0.16}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          x: springX,
          paddingLeft: sideInset,
          paddingRight: sideInset,
        }}
        className="flex items-center touch-pan-y cursor-grab active:cursor-grabbing py-3"
      >
        {items.map((item: T, index: number) => {
          const key = keyExtractor ? keyExtractor(item, index) : item.id || `stack-item-${index}`;
          const isActive = index === currentIndex;
          const isAdjacent = Math.abs(index - currentIndex) === 1;
          const distance = index - currentIndex;

          const handleSelect = () => {
            if (isDraggingRef.current) return;
            if (index !== currentIndex) {
              triggerHaptic('selection');
              goToIndex(index);
            } else {
              triggerHaptic('light');
              onCardClick?.(item, index);
            }
          };

          return (
            <div
              key={key}
              style={{
                marginRight: index < items.length - 1 ? cardGap : 0,
              }}
              className="shrink-0"
            >
              <StackCard
                index={index}
                cardWidth={cardWidth}
                cardGap={cardGap}
                springX={springX}
                isActive={isActive}
                isAdjacent={isAdjacent}
                isDraggingRef={isDraggingRef}
                animationConfig={DEFAULT_ANIMATION_CONFIG}
                onClick={handleSelect}
              >
                {renderCard({
                  item,
                  index,
                  isActive,
                  isAdjacent,
                  distance,
                  onSelect: handleSelect,
                  isDragging: isDraggingRef.current,
                })}
              </StackCard>
            </div>
          );
        })}
      </motion.div>

      {/* Fluid Pagination */}
      {showPagination && items.length > 1 && (
        <FluidPagination
          total={items.length}
          currentIndex={currentIndex}
          onSelect={goToIndex}
          tint={tint}
        />
      )}
    </div>
  );
}
