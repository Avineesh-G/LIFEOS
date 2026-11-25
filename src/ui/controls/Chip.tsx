import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  tint?: string;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  selected = false,
  onSelect,
  tint: _tint,
  icon,
  className = '',
  size = 'md',
}: ChipProps) {
  const accentText = 'var(--app-accent-text, #64D2FF)';
  const accentPrimary = 'var(--app-accent, #0A84FF)';

  const handleClick = () => {
    triggerHaptic('selection');
    if (onSelect) onSelect();
  };

  const heightClass = size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium select-none cursor-pointer transition-colors ${heightClass} ${
        selected ? 'text-white' : 'glass-flat text-[rgba(240,240,245,0.78)] hover:text-white'
      } ${className}`}
      style={
        selected
          ? {
              background: `linear-gradient(135deg, color-mix(in srgb, ${accentPrimary} 20%, #1D1D24) 0%, color-mix(in srgb, ${accentText} 10%, #17171C) 100%)`,
              color: accentText,
            }
          : undefined
      }
    >
      {selected ? (
        <CheckCircle size={size === 'sm' ? 14 : 16} weight="fill" className="shrink-0" />
      ) : (
        icon && <span className="shrink-0" style={{ color: accentText }}>{icon}</span>
      )}
      <span className="truncate">{label}</span>
    </motion.button>
  );
}

export default Chip;
