import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface InteractiveCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Usable Interactive Checkbox.
 * Snaps with spring physics, expanding emerald liquid ink fill, and dynamic vector whip checkmark.
 */
export default function InteractiveCheckbox({
  checked,
  onChange,
  size = 22,
  className = '',
  disabled = false,
}: InteractiveCheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    triggerHaptic(checked ? 'light' : 'success');
    onChange(!checked);
  };

  return (
    <motion.div
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
      aria-checked={checked}
      whileTap={{ scale: disabled ? 1 : 0.78 }}
      whileHover={{ scale: disabled ? 1 : 1.08 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none focus:outline-none shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Squircle Container */}
      <motion.div
        animate={{
          backgroundColor: checked ? '#10B981' : 'rgba(0, 0, 0, 0)',
          scale: checked ? [0.85, 1.1, 1] : 1,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 26 }}
        className={`w-full h-full rounded-[30%] border-[2px] flex items-center justify-center transition-colors duration-200 ${
          checked
            ? 'border-emerald-500 shadow-sm shadow-emerald-500/30'
            : 'border-black/25 dark:border-white/25 hover:border-emerald-500 text-neutral-400 dark:text-neutral-500 hover:text-emerald-500 dark:hover:text-emerald-400'
        }`}
      >
        {/* Dynamic Vector Whip Checkmark */}
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 16 16"
          fill="none"
          className="overflow-visible"
        >
          <motion.path
            d="M3 8.5L6.5 12L13 4"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              duration: 0.22,
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
