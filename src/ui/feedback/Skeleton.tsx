import React from 'react';

export interface SkeletonProps {
  className?: string;
  radius?: number;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  radius = 16,
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={`bg-[#1C1C1E] animate-pulse ${className}`}
      style={{
        borderRadius: `${radius}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}
