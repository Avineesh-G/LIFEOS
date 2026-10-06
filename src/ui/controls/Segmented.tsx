import React from 'react';
import { motion } from 'framer-motion';
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
  tint,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      className={`relative p-1 rounded-full flex items-center gap-1 select-none ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
      }}
    >
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
            className={`relative flex-1 min-w-0 py-1.5 px-2 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors z-10 ${
              isSelected ? 'text-white' : 'text-[rgba(240,240,245,0.60)] hover:text-white'
            }`}
            style={{ color: isSelected && tint ? tint : undefined }}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-[rgba(240,240,245,0.50)]'
                }`}
              >
                {opt.badge}
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId="segmented-active-thumb"
                className="absolute inset-0 rounded-full -z-10"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 3px 10px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 520,
                  damping: 38,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
