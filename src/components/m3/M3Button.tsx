import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { M3_SHAPE_TRANSITION } from '../../utils/motionConfig';

export interface M3ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'tonal' | 'secondary' | 'outlined' | 'text';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Material 3 Expressive Primary Action Button / FAB.
 * Morphs between a rounded-square resting shape (18-22px radius)
 * and a full pill/circular shape (9999px radius) on press/hover
 * with spring physics and tonal depth.
 */
export const M3Button = React.forwardRef<HTMLButtonElement, M3ButtonProps>(function M3Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon,
    className = '',
    onClick,
    disabled = false,
    ...props
  },
  ref
) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    triggerHaptic('light');
    onClick?.(e);
  };

  // M3 Variant Styling
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:bg-[var(--md-primary)]/90';
      break;
    case 'tonal':
      variantClasses =
        'bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)] hover:opacity-90';
      break;
    case 'secondary':
      variantClasses =
        'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)]';
      break;
    case 'outlined':
      variantClasses =
        'bg-transparent border border-[var(--md-outline)] text-[var(--md-primary)] hover:bg-[var(--md-primary)]/8';
      break;
    case 'text':
      variantClasses =
        'bg-transparent text-[var(--md-primary)] hover:bg-[var(--md-primary)]/8';
      break;
  }

  // Pixel Button Typography: 500 (Medium), never 700 (Bold)
  const sizeClasses =
    size === 'sm'
      ? 'px-3.5 py-1.5 text-[13px] leading-[18px] font-medium tracking-[0.05px]'
      : size === 'lg'
      ? 'px-6 py-3.5 text-[16px] leading-[24px] font-medium tracking-normal'
      : 'px-5 py-2.5 text-[15px] leading-[20px] font-medium tracking-normal';

  const restingRadius = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      initial={{ borderRadius: restingRadius }}
      whileHover={{
        borderRadius: 9999,
        scale: 1.02,
      }}
      whileTap={{
        borderRadius: 9999,
        scale: 0.96,
      }}
      transition={M3_SHAPE_TRANSITION}
      className={`relative inline-flex items-center justify-center gap-2 select-none overflow-hidden active:outline-none focus:outline-none transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
});

export default M3Button;
