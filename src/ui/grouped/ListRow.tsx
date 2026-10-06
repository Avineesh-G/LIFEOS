import React from 'react';
import { CaretRight } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';

export interface ListRowProps {
  icon?: React.ReactNode;
  iconTint?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
  showSeparator?: boolean;
  className?: string;
}

export function ListRow({
  icon,
  iconTint = '#0A84FF',
  title,
  subtitle,
  trailing,
  showChevron = false,
  onClick,
  destructive = false,
  showSeparator = true,
  className = '',
}: ListRowProps) {
  const isClickable = Boolean(onClick);

  const handleClick = () => {
    if (!isClickable) return;
    triggerHaptic(destructive ? 'error' : 'selection');
    if (onClick) onClick();
  };

  return (
    <div className="relative w-full group">
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (isClickable && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`w-full min-h-[52px] px-4 py-3 flex items-center gap-3.5 transition-colors select-none ${
          isClickable ? 'cursor-pointer active:bg-[#2C2C2E]' : ''
        } ${className}`}
      >
        {/* Leading Icon Tile: 32x32 squircle (r=10) with pure droplet chassis */}
        {icon && (
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.14)',
              color: iconTint,
            }}
          >
            {icon}
          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div
            className={`text-[16.5px] leading-[22px] font-semibold tracking-tight truncate ${
              destructive ? 'text-[#FF453A]' : 'text-white'
            }`}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-[13px] leading-[18px] font-normal text-[rgba(240,240,245,0.72)] truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>

        {/* Trailing Value or Actions */}
        {trailing && (
          <div className="text-[14.5px] font-medium text-[rgba(240,240,245,0.75)] shrink-0 flex items-center gap-1.5">
            {trailing}
          </div>
        )}

        {/* Trailing Caret */}
        {showChevron && (
          <div className="text-[rgba(255,255,255,0.45)] shrink-0">
            <CaretRight size={14} weight="bold" />
          </div>
        )}
      </div>

      {/* Hairline Separator: 0.5px, inset 16px past leading icon */}
      {showSeparator && (
        <div
          className="absolute bottom-0 right-0 h-[0.5px] bg-[#38383A]"
          style={{
            left: icon ? '58px' : '16px',
          }}
        />
      )}
    </div>
  );
}
