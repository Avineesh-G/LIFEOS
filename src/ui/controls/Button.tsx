import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { GlassSurface } from '../glass/GlassSurface';

export type ButtonVariant = 'prominent' | 'glass' | 'plain' | 'destructive';
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

  const heightClass = size === 'sm' ? 'h-9 px-3.5 text-xs' : size === 'md' ? 'h-11 px-5 text-sm' : 'h-[50px] px-6 text-[17px]';

  if (variant === 'glass') {
    return (
      <GlassSurface
        as={motion.button}
        interactive={!disabled}
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none cursor-pointer transition-opacity ${heightClass} ${
          disabled ? 'opacity-40 pointer-events-none' : ''
        } ${className}`}
        style={{ color: tint }}
        {...(props as any)}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </GlassSurface>
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

  // Prominent (Default)
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none cursor-pointer text-white shadow-lg ${heightClass} ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
      style={{ backgroundColor: tint }}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </motion.button>
  );
}
