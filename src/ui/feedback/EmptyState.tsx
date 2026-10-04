import React from 'react';
import { Button } from '../controls/Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tint?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tint = '#0A84FF',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`w-full py-12 px-6 flex flex-col items-center text-center select-none ${className}`}
    >
      <div className="w-14 h-14 text-[rgba(235,235,245,0.30)] flex items-center justify-center text-4xl mb-4">
        {icon}
      </div>
      <h3 className="text-[20px] font-bold text-white tracking-tight leading-snug">{title}</h3>
      {description && (
        <p className="text-[15px] text-[rgba(235,235,245,0.60)] mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="prominent" tint={tint} size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
