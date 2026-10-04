import React from 'react';
import { Plus, Minus } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { GlassSurface } from '../glass/GlassSurface';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  tint?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Stepper({
  value,
  min = 0,
  max = 9999,
  step = 1,
  onChange,
  unit = '',
  tint = '#0A84FF',
  size = 'md',
  className = '',
}: StepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      triggerHaptic('light');
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      triggerHaptic('light');
      onChange(Math.min(max, value + step));
    }
  };

  const btnSize = size === 'lg' ? 'w-12 h-12 text-xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  const valSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-base' : 'text-2xl';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <GlassSurface
        as="button"
        interactive={value > min}
        onClick={handleDecrement}
        disabled={value <= min}
        className={`${btnSize} rounded-full flex items-center justify-center text-white ${
          value <= min ? 'opacity-30 pointer-events-none' : ''
        }`}
      >
        <Minus weight="bold" />
      </GlassSurface>

      <div className="flex items-baseline gap-1 text-center min-w-[3rem]">
        <span className={`font-bold tabular-nums text-white ${valSize}`} style={{ color: tint }}>
          {value}
        </span>
        {unit && <span className="text-xs text-[rgba(235,235,245,0.60)]">{unit}</span>}
      </div>

      <GlassSurface
        as="button"
        interactive={value < max}
        onClick={handleIncrement}
        disabled={value >= max}
        className={`${btnSize} rounded-full flex items-center justify-center text-white ${
          value >= max ? 'opacity-30 pointer-events-none' : ''
        }`}
      >
        <Plus weight="bold" />
      </GlassSurface>
    </div>
  );
}
