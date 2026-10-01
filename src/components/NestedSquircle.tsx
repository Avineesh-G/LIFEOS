import React from 'react';

export interface NestedSquircleProps {
  parentRadiusPx?: number;
  parentPaddingPx?: number;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  as?: React.ElementType;
  [key: string]: any;
}

/**
 * React Component for Automatic Nested Radius Calculation.
 * Implements the formula: inner radius = max(10px, parent radius - parent padding)
 * Example: Outer card of 28px with 12px padding gives inner radius of 16px.
 */
export default function NestedSquircle({
  parentRadiusPx = 28,
  parentPaddingPx = 12,
  className = '',
  children,
  style,
  as: Component = 'div',
  ...restProps
}: NestedSquircleProps) {
  const computedInnerRadius = Math.max(10, parentRadiusPx - parentPaddingPx);

  return (
    <Component
      className={`r-nested ${className}`}
      style={{
        borderRadius: `${computedInnerRadius}px`,
        ...style,
      }}
      {...restProps}
    >
      {children}
    </Component>
  );
}
