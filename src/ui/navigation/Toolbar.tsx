import React from 'react';
import { GlassSurface } from '../glass/GlassSurface';

export interface ToolbarProps {
  leading?: React.ReactNode;
  center?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function Toolbar({
  leading,
  center,
  trailing,
  className = '',
}: ToolbarProps) {
  return (
    <div
      className={`relative w-full h-[44px] px-4 flex items-center justify-between z-30 select-none ${className}`}
    >
      {/* Leading Group */}
      <div className="flex items-center gap-2">{leading}</div>

      {/* Center Inline Title (when collapsed) */}
      <div className="flex items-center justify-center flex-1 px-2">{center}</div>

      {/* Trailing Group */}
      <div className="flex items-center gap-2">{trailing}</div>
    </div>
  );
}

export function ToolbarGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassSurface
      className={`h-[44px] px-1.5 rounded-full flex items-center gap-1 shadow-lg ${className}`}
    >
      {children}
    </GlassSurface>
  );
}

export function ToolbarButton({
  icon,
  label,
  onClick,
  tint,
  className = '',
}: {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  tint?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 rounded-full flex items-center justify-center text-white active:bg-white/10 transition-colors ${className}`}
      style={{ color: tint }}
      aria-label={label}
    >
      <span className="text-lg shrink-0">{icon}</span>
    </button>
  );
}
