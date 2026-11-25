import React from 'react';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3;
  tinted?: boolean;
  grain?: boolean;
  interactive?: boolean;
  accent?: string;
  children?: React.ReactNode;
  className?: string;
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(({
  level = 1,
  tinted = false,
  grain = false,
  interactive = false,
  accent,
  children,
  className = '',
  style,
  ...props
}, ref) => {
  const { isLite } = usePerformanceMode();

  const surfaceClass = level === 3 ? 'glass-hero' : level === 2 ? 'glass-card' : 'glass-tile';
  const tintVars = (tinted || accent)
    ? ({
        '--card-accent': accent || 'var(--app-accent, #7B4B36)',
        '--tile-accent': accent || 'var(--app-accent, #7B4B36)',
      } as React.CSSProperties)
    : {};

  return (
    <div
      ref={ref}
      className={`
        relative overflow-hidden rounded-[28px]
        ${surfaceClass}
        shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] transition-transform duration-150
        ${interactive ? 'active:scale-[0.98] cursor-pointer touch-manipulation' : ''}
        ${className}
      `}
      style={{
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        ...tintVars,
        ...style,
      }}
      {...props}
    >
      {/* Subtle iOS Water Meniscus + Light Single-Hue Ambient Sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-10 opacity-45"
        style={{
          background:
            'radial-gradient(ellipse 90% 100% at 50% 0%, rgba(255,255,255,0.14) 0%, color-mix(in srgb, var(--tile-accent, var(--app-accent, #7B4B36)) 14%, transparent) 55%, transparent 100%)',
        }}
      />

      {/* Fine dotted grain overlay for tactile depth (Full performance mode only) */}
      {grain && !isLite && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
            backgroundSize: '8px 8px',
          }}
        />
      )}

      {children}
    </div>
  );
});

GlassSurface.displayName = 'GlassSurface';
export default GlassSurface;
