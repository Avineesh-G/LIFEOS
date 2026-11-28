import React, { useEffect, useRef } from 'react';
import { triggerHaptic } from '../../utils/haptics';

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  tint?: string;
  className?: string;
  showBack?: boolean;
}

/**
 * Page Title & Action Row rendered directly beneath the global Floating Capsule Header.
 * Keeps large heading, Warm Brown accent subtitle indicator, and page-specific action buttons aligned cleanly.
 */
export function LargeTitleHeader({
  title,
  subtitle,
  onBack,
  actions,
  tint: _tint,
  className = '',
  showBack: _showBack = true,
}: LargeTitleHeaderProps) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // Intercept global capsule header Back presses when a page defines custom back logic (e.g. closing folders/modals)
  useEffect(() => {
    if (!onBack) return;
    const handleGlobalBack = (e: Event) => {
      if (onBackRef.current) {
        e.preventDefault();
        triggerHaptic('light');
        onBackRef.current();
      }
    };
    window.addEventListener('lifeos-header-back', handleGlobalBack);
    return () => window.removeEventListener('lifeos-header-back', handleGlobalBack);
  }, [Boolean(onBack)]);

  const accentText = 'var(--app-accent-text, #D29B7E)';
  const accentPrimary = 'var(--app-accent, #7B4B36)';

  return (
    <div className={`w-full select-none ${className}`}>
      <div className="px-1.5 pt-1.5 pb-3 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          {subtitle && (
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accentPrimary}, ${accentText})`,
                }}
              />
              <div
                className="text-sub font-medium truncate"
                style={{ color: `color-mix(in srgb, ${accentText} 55%, rgba(242, 242, 247, 0.85))` }}
              >
                {subtitle}
              </div>
            </div>
          )}
          <h1 className="text-large-title text-white tracking-[-0.02em] leading-tight">
            {title}
          </h1>
        </div>
        {actions && <div className="shrink-0 flex items-center pb-0.5">{actions}</div>}
      </div>
    </div>
  );
}

export default LargeTitleHeader;
