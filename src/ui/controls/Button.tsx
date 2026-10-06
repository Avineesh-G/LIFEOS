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
  tint = '#0A84FF',
  icon,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    triggerHaptic(variant === 'destructive' ? 'error' : 'light');
    if (onClick) onClick(e);
  };

  const heightClass = size === 'sm' ? 'h-9 px-3.5 text-xs' : size === 'md' ? 'h-11 px-5 text-sm' : 'h-[50px] px-6 text-[16px]';

  // Toolbar action pill button (Section 3.5: 36px height, glass-nav look, tint text + icon, no outline)
  if (variant === 'pill') {
    return (
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        onClick={handleClick}
        disabled={disabled}
        className={`h-9 px-3.5 rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-[13px] glass-nav nav-rim-light select-none cursor-pointer transition-opacity ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
        style={{ color: tint }}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </motion.button>
    );
  }

  if (variant === 'glass') {
    return (
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
        onClick={handleClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none cursor-pointer glass-nav nav-rim-light transition-opacity ${heightClass} ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
        style={{ color: tint }}
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
        style={{ color: tint }}
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
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none cursor-pointer text-white bg-[#FF453A] ${heightClass} ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </motion.button>
    );
  }

  // Prominent Primary Button (Section 3.5: tint fill + top sheen + inner top highlight, no outline)
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
        backgroundColor: tint,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 8px 24px -6px rgba(0, 0, 0, 0.6)`,
      }}
      {...props}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 100%)',
        }}
      />
      {icon && <span className="relative z-10 shrink-0">{icon}</span>}
      {children && <span className="relative z-10">{children}</span>}
    </motion.button>
  );
}
