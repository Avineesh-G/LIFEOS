import React from 'react';

export interface ToolbarProps {
  leading?: React.ReactNode;
  center?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Liquid Glass v2 Toolbar (Section 4.1):
 * Height 44px, one row only. Leading/trailing controls wrapped in 40px glass circles or pills.
 */
export function Toolbar({
  leading,
  center,
  trailing,
  className = '',
}: ToolbarProps) {
  return (
    <div
      className={`relative w-full h-[44px] flex items-center justify-between z-30 select-none px-3 ${className}`}
    >
      {/* Leading slot: 40px glass circle */}
      <div className="flex items-center shrink-0 min-w-[40px]">{leading}</div>

      {/* Center inline title (collapses smoothly on scroll) */}
      <div className="flex items-center justify-center flex-1 min-w-0 px-2 text-center">
        {center}
      </div>

      {/* Trailing slot: optional pill or actions */}
      <div className="flex items-center justify-end shrink-0 min-w-[40px]">{trailing}</div>
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
    <div
      className={`h-10 px-1 rounded-full glass-grouped-toolbar nav-rim-light flex items-center gap-1 select-none ${className}`}
    >
      {children}
    </div>
  );
}

export function GroupedToolbar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`h-10 px-1.5 rounded-full glass-grouped-toolbar nav-rim-light inline-flex items-center gap-1 shadow-lg select-none ${className}`}
    >
      {children}
    </div>
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
      className={`w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white active:scale-92 transition-all cursor-pointer ${className}`}
      style={{ color: tint }}
      aria-label={label}
      title={label}
    >
      <span className="text-base shrink-0">{icon}</span>
    </button>
  );
}

