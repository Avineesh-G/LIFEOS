import React from 'react';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3;
  tinted?: boolean;
  grain?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(({
  level = 1,
  tinted = false,
  grain = false,
  interactive = false,
  children,
  className = '',
  style,
  ...props
}, ref) => {
  const { isLite } = usePerformanceMode();

  // Glass background levels: 1 = lowest (0.05 dark / 0.55 light), 2 = mid (0.08 dark / 0.70 light), 3 = high (0.12 dark / 0.82 light)
  const bgClasses = {
    1: 'bg-[var(--glass-1)] dark:bg-[rgba(255,255,255,0.05)] light:bg-[rgba(255,255,255,0.55)]',
    2: 'bg-[var(--glass-2)] dark:bg-[rgba(255,255,255,0.08)] light:bg-[rgba(255,255,255,0.70)]',
    3: 'bg-[var(--glass-3)] dark:bg-[rgba(255,255,255,0.12)] light:bg-[rgba(255,255,255,0.82)]',
  }[level];

  // Tint overlay style with active interface accent
  const tintStyle: React.CSSProperties = tinted ? {
    backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
  } : {};

  // Lite mode falls back to translucent flat background without blur
  const backdropStyle: React.CSSProperties = isLite ? {
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  } : {
    backdropFilter: 'var(--glass-blur, blur(24px) saturate(140%))',
    WebkitBackdropFilter: 'var(--glass-blur, blur(24px) saturate(140%))',
  };

  return (
    <div
      ref={ref}
      className={`
        relative overflow-hidden rounded-[28px]
        border border-[var(--rim,rgba(255,255,255,0.08))]
        shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] transition-all duration-200
        ${bgClasses}
        ${interactive ? 'active:scale-[0.98] hover:border-white/20 cursor-pointer touch-manipulation' : ''}
        ${className}
      `}
      style={{
        ...backdropStyle,
        ...tintStyle,
        ...style,
      }}
      {...props}
    >
      {/* Subtle top edge bevel highlight for 3D tactile glass depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Fine dotted grain overlay for extra tactile depth (Full performance mode only) */}
      {grain && !isLite && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
            backgroundSize: '8px 8px',
          }}
        />
      )}
      
      {/* Subtle inner top highlight rim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {children}
    </div>
  );
});

GlassSurface.displayName = 'GlassSurface';
export default GlassSurface;
