/**
 * LifeOS — Premium Horizontal Card Stacking & Navigation Types
 * Follows Liquid Glass & Material 3 Expressive guidelines (AGENTS.md).
 * Transforms and Opacity ONLY for 60/120fps Android WebView performance.
 */

import React from 'react';
import type { Transition } from 'framer-motion';

export interface StackItem {
  id: string;
  [key: string]: any;
}

export interface StackCardRenderProps<T extends StackItem = StackItem> {
  item: T;
  index: number;
  isActive: boolean;
  isAdjacent: boolean;
  distance: number;
  onSelect: () => void;
  isDragging: boolean;
}

export interface StackAnimationConfig {
  activeScale: number;
  adjacentScale: number;
  distantScale: number;
  maxRotationDeg: number;
  adjacentOpacity: number;
  distantOpacity: number;
  perspective: number;
  spring: Transition;
}

export interface HorizontalCardStackProps<T extends StackItem = StackItem> {
  items: T[];
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  renderCard: (props: StackCardRenderProps<T>) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  onCardClick?: (item: T, index: number) => void;
  peekWidth?: number;
  cardGap?: number;
  className?: string;
  showPagination?: boolean;
  paginationVariant?: 'fluid' | 'dots' | 'numeric';
  tint?: string;
  ariaLabel?: string;
}
