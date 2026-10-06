import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  activeColor = '#30D158',
  className = '',
}: SwitchProps) {
  const [isPressed, setIsPressed] = useState(false);

  const toggle = () => {
    if (disabled) return;
    triggerHaptic('light');
    onChange(!checked);
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
      onPointerDown={() => !disabled && setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={`relative inline-flex items-center w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 cursor-pointer select-none ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
      style={{
        backgroundColor: checked ? activeColor : '#39393D',
      }}
    >
      <motion.div
        animate={{
          x: checked ? 20 : 0,
          width: isPressed ? 32 : 27,
          height: 27,
        }}
        transition={{
          type: 'spring',
          stiffness: 520,
          damping: 38,
        }}
        className="rounded-full bg-white select-none"
        style={{
          boxShadow: isPressed
            ? '0 4px 14px rgba(0,0,0,0.5), inset 0 1.2px 1.5px rgba(255,255,255,1), inset 0 -1px 1px rgba(0,0,0,0.2)'
            : '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.95), inset 0 -1px 0.5px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
}
