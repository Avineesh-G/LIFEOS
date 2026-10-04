import React from 'react';

export interface GroupedListProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function GroupedList({
  header,
  footer,
  children,
  className = '',
}: GroupedListProps) {
  return (
    <div className={`w-full flex flex-col gap-1.5 my-1.5 ${className}`}>
      {header && (
        <div className="text-[12px] font-bold text-[rgba(255,255,255,0.70)] uppercase tracking-wider px-3 select-none">
          {header}
        </div>
      )}
      <div className="w-full bg-[#1C1C1E] rounded-[24px] overflow-hidden border border-white/[0.09] shadow-[0_6px_24px_rgba(0,0,0,0.55)]">
        {children}
      </div>
      {footer && (
        <div className="text-[13px] text-[rgba(240,240,245,0.60)] px-4 leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  );
}
