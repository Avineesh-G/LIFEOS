import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useGlassTier } from './useGlassTier';
import './glassStyles.css';

export interface GlassSurfaceProps extends Omit<HTMLMotionProps<'div'>, 'as'> {
  as?: any;
  tint?: string;
  tintOpacity?: number;
  interactive?: boolean;
  specularRim?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: any) => void;
}

export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  {
    as: Component = motion.div,
    tint,
    tintOpacity = 0.28,
    interactive = false,
    specularRim = true,
    className = '',
    style = {},
    disabled,
    children,
    ...props
  },
  ref
) {
  const tier = useGlassTier();

  const tierClass = tier === 'tier-3' ? 'glass-tier-3' : tier === 'tier-2' ? 'glass-tier-2' : 'glass-tier-1';
  const rimClass = specularRim ? 'specular-rim' : '';

  const MotionComponent = Component === 'button' ? motion.button : Component === 'div' ? motion.div : Component;

  return (
    <MotionComponent
      ref={ref}
      disabled={disabled}
      className={`relative overflow-hidden ${tierClass} ${rimClass} ${className}`}
      style={{
        ...(tint
          ? {
              backgroundColor:
                tier === 'tier-1'
                  ? `rgba(28, 28, 30, 0.96)`
                  : `color-mix(in srgb, ${tint} ${Math.round(tintOpacity * 100)}%, rgba(44,44,46,0.50))`,
            }
          : {}),
        ...style,
      }}
      whileTap={
        interactive && !disabled
          ? {
              scale: 0.97,
              transition: { type: 'spring', stiffness: 520, damping: 40 },
            }
          : undefined
      }
      {...props}
    >
      {children}
    </MotionComponent>
  );
});
