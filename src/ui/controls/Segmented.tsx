import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { GlassSurface } from '../glass/GlassSurface';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
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
    <GlassSurface
      className={`relative p-1 rounded-full flex items-center gap-1 select-none ${className}`}
      specularRim={false}
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
            className={`relative flex-1 py-1.5 px-3 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors z-10 ${
              isSelected ? 'text-white' : 'text-[rgba(235,235,245,0.60)] hover:text-white'
            }`}
            style={{ color: isSelected && tint ? tint : undefined }}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {isSelected && (
              <motion.div
                layoutId="segmented-thumb"
                className="absolute inset-0 bg-[rgba(255,255,255,0.18)] rounded-full -z-10 shadow-sm border border-white/20"
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
    </GlassSurface>
  );
}
