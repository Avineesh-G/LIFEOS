import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated';
}

/**
 * Shared LifeOS Card Primitive.
 * Renders a pixel-native surface cut from the same material as the PixelSky background.
 * Pure alpha-blended surface, repeating pixel-grid texture overlay, zero blur, pixel-unit aligned borders.
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  ...props
}: CardProps) {
  const elevationClass = variant === 'elevated' ? 'shadow-md' : 'shadow-xs';
  return (
    <div
      className={`card ${elevationClass} ${className}`}
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
