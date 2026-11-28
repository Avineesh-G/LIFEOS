import React from 'react';

export interface CapsuleHeaderProps {
  title: string;
  icon: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onCenterClick?: () => void;
  className?: string;
}

/**
 * Unified Floating OLED Liquid Glass Capsule Header
 * Matches the pill aesthetic (left circular action, mathematically centered title badge with Warm Brown accent dot, right circular actions).
 */
export function CapsuleHeader({
  title,
  icon,
  leading,
  trailing,
  onCenterClick,
  className = '',
}: CapsuleHeaderProps) {
  return (
    <header
      className={`sticky top-0 left-0 right-0 z-30 w-full pointer-events-none select-none ${className}`}
      style={{
        paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 24px) + 8px)',
        paddingBottom: '8px',
        paddingLeft: 'max(var(--sal, 0px), env(safe-area-inset-left, 0px), 14px)',
        paddingRight: 'max(var(--sar, 0px), env(safe-area-inset-right, 0px), 14px)',
      }}
    >
      {/* Full-header ambient vignette so scrolling cards fade cleanly beneath the floating pill on all notch heights */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black via-black/82 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Outer Floating Capsule Toolbar: Grid ensures mathematical center + zero button collision down to 320px viewports */}
      <div className="relative h-[52px] px-2 rounded-full glass-nav nav-rim-light shadow-2xl grid grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-1.5 w-full max-w-lg mx-auto pointer-events-auto">
        {/* Left Navigation / Profile Slot */}
        <div className="flex items-center justify-start gap-1.5 z-10 min-w-0">
          {leading}
        </div>

        {/* Mathematically Centered Interface Identity Pill */}
        <div className="flex items-center justify-center z-10 min-w-0 max-w-full">
          {onCenterClick ? (
            <button
              type="button"
              onClick={onCenterClick}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full glass-tile hover:bg-white/[0.08] active:scale-95 transition-transform cursor-pointer touch-manipulation shadow-sm max-w-full min-w-0"
            >
              <span
                className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                  color: 'var(--app-accent-text, #D29B7E)',
                }}
              >
                {icon}
              </span>
              <span className="text-[12.5px] sm:text-[13px] font-bold tracking-tight text-white leading-none whitespace-nowrap truncate min-w-0">
                {title}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--app-accent-text, #D29B7E)' }}
              />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full glass-tile shadow-sm max-w-full min-w-0">
              <span
                className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                  color: 'var(--app-accent-text, #D29B7E)',
                }}
              >
                {icon}
              </span>
              <span className="text-[12.5px] sm:text-[13px] font-bold tracking-tight text-white leading-none whitespace-nowrap truncate min-w-0">
                {title}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--app-accent-text, #D29B7E)' }}
              />
            </div>
          )}
        </div>

        {/* Right Action / Reload Slot */}
        <div className="flex items-center justify-end gap-1.5 z-10 min-w-0">
          {trailing}
        </div>
      </div>
    </header>
  );
}

export default CapsuleHeader;

