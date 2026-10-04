import React from 'react';
import { MagnifyingGlass, Microphone } from '../tokens/icons';
import { GlassSurface } from '../glass/GlassSurface';
import { triggerHaptic } from '../../utils/haptics';

export interface SearchPillProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onMicClick?: () => void;
  className?: string;
}

export function SearchPill({
  value,
  onChange,
  placeholder = 'Search...',
  onMicClick,
  className = '',
}: SearchPillProps) {
  return (
    <GlassSurface
      className={`w-full h-[48px] px-4 rounded-full flex items-center gap-3 shadow-xl border border-white/14 ${className}`}
    >
      <div className="text-[rgba(235,235,245,0.40)] text-lg shrink-0">
        <MagnifyingGlass weight="bold" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[16px] text-white placeholder-[rgba(235,235,245,0.30)] focus:outline-none"
      />

      {onMicClick && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onMicClick();
          }}
          className="p-1 rounded-full text-[rgba(235,235,245,0.50)] hover:text-white transition-colors"
        >
          <Microphone size={18} weight="fill" />
        </button>
      )}
    </GlassSurface>
  );
}
