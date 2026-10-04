import React from 'react';

/**
 * Groups adjacent glass shapes (e.g. TabBar and BottomCircle) so they share
 * one unified backdrop composite layer, avoiding multiple GPU layers.
 */
export function GlassContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative isolate pointer-events-none ${className}`}>
      {children}
    </div>
  );
}
