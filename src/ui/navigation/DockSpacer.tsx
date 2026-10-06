import React from 'react';

export function DockSpacer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-full shrink-0 select-none pointer-events-none ${className}`}
      style={{
        height: 'calc(56px + max(env(safe-area-inset-bottom, 0px), 12px) + 28px)',
      }}
      aria-hidden="true"
    />
  );
}
