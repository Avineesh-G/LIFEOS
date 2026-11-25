import React from 'react';

export interface GroupedListProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
  className?: string;
}

export function GroupedList({
  header,
  footer,
  children,
  accent: _accent,
  className = '',
}: GroupedListProps) {
  return (
    <div className={`w-full flex flex-col gap-1.5 my-1.5 ${className}`}>
      {header && (
        <div
          className="text-[12px] uppercase tracking-wider font-semibold px-3 select-none flex items-center gap-1.5"
          style={{ color: 'color-mix(in srgb, var(--app-accent-text, #5AC8FA) 40%, rgba(235, 235, 245, 0.72))' }}
        >
          <span>{header}</span>
        </div>
      )}
      <div className="w-full glass-row overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.65)]">
        {children}
      </div>
      {footer && (
        <div className="text-[12.5px] text-[rgba(240,240,245,0.58)] px-4 leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  );
}
