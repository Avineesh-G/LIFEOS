import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface M3ToggleChipProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Material 3 Expressive Filled-vs-Outline Toggle Chip (Reference Image 12 pattern)
 * Visually fills solid with section accent (--md-primary) when ON
 * and sits dark/muted/outline when OFF, with a spring snap transition.
 */
export default function M3ToggleChip({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: M3ToggleChipProps) {
  const handleToggle = () => {
    if (disabled) return;
    triggerHaptic(checked ? 'light' : 'medium');
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={`relative inline-flex items-center gap-2 select-none focus:outline-none active:scale-95 transition-transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Switch track pill */}
      <motion.div
        animate={{
          backgroundColor: checked ? 'var(--md-primary)' : 'transparent',
          borderColor: checked ? 'var(--md-primary)' : 'var(--md-outline)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-13 h-7 rounded-full p-0.5 border-2 flex items-center transition-colors shadow-none relative"
        style={{ width: '52px', height: '28px' }}
      >
        {/* Sliding Thumb */}
        <motion.div
          animate={{
            x: checked ? 24 : 2,
            scale: checked ? 1 : 0.85,
          }}
          transition={{ type: 'spring', stiffness: 550, damping: 32 }}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-sm ${
            checked
              ? 'bg-[var(--md-on-primary)] text-[var(--md-primary)]'
              : 'bg-[var(--md-outline)] text-transparent'
          }`}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 25 }}
            >
              <Check size={12} strokeWidth={3.5} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {label && (
        <span className="text-xs font-semibold text-[var(--md-on-surface)] tracking-tight">
          {label}
        </span>
      )}
    </button>
  );
}
