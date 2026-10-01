import React from 'react';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface LiquidFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  noBorder?: boolean;
}

export const LiquidFrame = React.forwardRef<HTMLDivElement, LiquidFrameProps>(({
  children,
  className = '',
  style,
  noBorder = true,
  ...props
}, ref) => {
  const { isLite } = usePerformanceMode();

  return (
    <div
      ref={ref}
      className={`
        relative overflow-hidden rounded-[32px] p-5 sm:p-6
        bg-[var(--glass-2)] dark:bg-[rgba(5,11,13,0.85)] light:bg-[rgba(255,255,255,0.75)]
        shadow-xl dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-300
        border-none outline-none ring-0 focus:outline-none focus:ring-0
        ${className}
      `}
      style={{
        border: 'none',
        outline: 'none',
        backdropFilter: isLite ? 'none' : 'blur(28px) saturate(150%)',
        WebkitBackdropFilter: isLite ? 'none' : 'blur(28px) saturate(150%)',
        ...style,
      }}
      {...props}
    >
      {/* Outer ambient glow (Full performance mode only) */}
      {!isLite && (
        <div
          className="pointer-events-none absolute -inset-10 rounded-[40px] opacity-25 blur-2xl transition-opacity duration-700"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--bg-glow-1, rgba(15,118,110,0.3)) 0%, var(--bg-glow-2, rgba(14,116,144,0.2)) 50%, transparent 80%)',
          }}
        />
      )}

      {/* Optional refractive border rings (only rendered if noBorder is explicitly false) */}
      {!noBorder && (
        <>
          {/* Layer 1: Outer concave refractive border highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[32px] p-[1.5px]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, var(--accent-glow, rgba(45,212,191,0.35)) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Layer 2: Inner refraction ring */}
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[30px] p-[1px] opacity-60"
            style={{
              background: 'linear-gradient(315deg, rgba(255,255,255,0.15) 0%, transparent 60%, rgba(255,255,255,0.08) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        </>
      )}

      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

LiquidFrame.displayName = 'LiquidFrame';
export default LiquidFrame;
