import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export type ButtonVariant = 'prominent' | 'glass' | 'plain' | 'destructive' | 'pill';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tint?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'prominent',
  size = 'lg',
  tint: _tint,
  icon,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const accentPrimary = 'var(--app-accent, #7B4B36)';
  const accentEnd = 'var(--app-accent-end, #A46D52)';
  const accentText = 'var(--app-accent-text, #D29B7E)';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    triggerHaptic(variant === 'destructive' ? 'error' : 'light');
    if (onClick) onClick(e);
  };

  const heightClass = size === 'sm' ? 'h-9 px-3.5 text-xs' : size === 'md' ? 'h-11 px-5 text-sm' : 'h-[50px] px-6 text-[16px]';

  if (variant === 'pill' || variant === 'glass') {
    return (
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        onClick={handleClick}
        disabled={disabled}
        className={`${variant === 'pill' ? 'h-9 px-3.5 text-[13px]' : heightClass} rounded-full inline-flex items-center justify-center gap-2 font-semibold glass-nav nav-rim-light select-none cursor-pointer transition-opacity ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
        style={{ color: accentText }}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </motion.button>
    );
  }

  if (variant === 'plain') {
    return (
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        onClick={handleClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-1.5 font-medium select-none cursor-pointer ${
          size === 'sm' ? 'text-xs' : 'text-[15px]'
        } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
        style={{ color: accentText }}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </motion.button>
    );
  }

  if (variant === 'destructive') {
    return (
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        onClick={handleClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none cursor-pointer text-white ${heightClass} ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
        style={{
          background: 'linear-gradient(135deg, #FF453A 0%, #E03546 100%)',
          boxShadow: '0 8px 22px -6px rgba(255, 69, 58, 0.45)',
        }}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </motion.button>
    );
  }

  // Prominent Primary Button: Single unified theme color subtle gradient + crisp white text
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none cursor-pointer text-white overflow-hidden shadow-lg ${heightClass} ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentPrimary} 0%, ${accentEnd} 100%)`,
        boxShadow: `0 10px 24px -8px color-mix(in srgb, ${accentPrimary} 45%, rgba(0, 0, 0, 0.7))`,
      }}
      {...props}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0) 60%)',
        }}
      />
      {icon && <span className="relative z-10 shrink-0">{icon}</span>}
      {children && <span className="relative z-10">{children}</span>}
    </motion.button>
  );
}
