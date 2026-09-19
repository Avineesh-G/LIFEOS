import React from 'react';
import { M3_SHAPES } from '../theme/shapes';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'high' | 'highest';
  elevation?: 0 | 1 | 2 | 3 | 4;
  shape?: 'standard' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full' | 'asymmetricHero';
}

const SHAPE_MAP: Record<string, string> = {
  standard: M3_SHAPES.standardCard,
  sm: 'rounded-[var(--md-shape-sm)]',
  md: 'rounded-[var(--md-shape-md)]',
  lg: 'rounded-[var(--md-shape-lg)]',
  xl: 'rounded-[var(--md-shape-xl)]',
  xxl: 'rounded-[var(--md-shape-xxl)]',
  full: 'rounded-[var(--md-shape-full)]',
  asymmetricHero: M3_SHAPES.asymmetricHero,
};

const ELEVATION_MAP: Record<number, string> = {
  0: 'm3-elevation-0',
  1: 'm3-elevation-1',
  2: 'm3-elevation-2',
  3: 'm3-elevation-3',
  4: 'm3-elevation-4',
};

/**
 * Material 3 Expressive Card Primitive.
 * Features dual tonal shift + subtle shadow elevation (Levels 0-4),
 * semantic shape catalog assignments, and zero harsh box shadows.
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  elevation,
  shape = 'lg',
  ...props
}: CardProps) {
  const resolvedElevation = elevation !== undefined 
    ? elevation 
    : (variant === 'elevated' ? 2 : variant === 'high' ? 3 : variant === 'highest' ? 4 : 1);

  const elevationClass = ELEVATION_MAP[resolvedElevation] || ELEVATION_MAP[1];
  const shapeClass = SHAPE_MAP[shape] || SHAPE_MAP.lg;

  return (
    <div
      className={`card ${elevationClass} ${shapeClass} border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] transition-[box-shadow,background-color] duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between pb-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
