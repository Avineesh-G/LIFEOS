import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  tint?: string;
  className?: string;
}

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  tint: _tint,
  className = '',
}: SegmentedProps<T>) {
  const accentText = 'var(--app-accent-text, #64D2FF)';
  const accentPrimary = 'var(--app-accent, #0A84FF)';

  return (
    <div className={`relative p-1 rounded-full flex items-center gap-1 select-none glass-flat ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (!isSelected) {
                triggerHaptic('selection');
                onChange(opt.value);
              }
            }}
            className={`relative flex-1 min-w-0 py-1.5 px-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 z-10 cursor-pointer active:scale-[0.97] ${
              isSelected ? 'droplet-active' : 'text-[rgba(240,240,245,0.68)] hover:text-white'
            }`}
            style={
              isSelected
                ? { color: accentText }
                : undefined
            }
          >
            {opt.icon && (
              <span
                className="shrink-0"
                style={{ color: isSelected ? accentText : 'rgba(240,240,245,0.62)' }}
              >
                {opt.icon}
              </span>
            )}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className="text-[11px] font-bold px-1.5 py-0.2 rounded-full"
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in srgb, ${accentPrimary} 22%, rgba(255,255,255,0.10))`
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#FFFFFF' : 'rgba(240,240,245,0.62)',
                }}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
