import React from 'react';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  glowOpacity?: number;
}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(({
  children,
  className = '',
  glowOpacity = 0.35,
  style,
  ...props
}, ref) => {
  const { isLite } = usePerformanceMode();

  return (
    <div
      ref={ref}
      className={`
        relative overflow-hidden rounded-[30px] p-4 sm:p-5
        bg-[#050B0D]/90 dark:bg-[#050B0D]/90 light:bg-white/80
        transition-all duration-300
        ${className}
      `}
      style={{
        backdropFilter: isLite ? 'none' : 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: isLite ? 'none' : 'blur(28px) saturate(140%)',
        ...style,
      }}
      {...props}
    >
      {/* Outer Glow behind bottom rim (Full performance mode only) */}
      {!isLite && (
        <div
          className="pointer-events-none absolute -bottom-6 -inset-x-4 h-24 rounded-full blur-xl transition-opacity duration-500"
          style={{
            background: 'var(--glow-rim)',
            opacity: glowOpacity,
          }}
        />
      )}

      {/* Gradient Border Rim */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[30px] p-[1.5px]"
        style={{
          background: 'linear-gradient(180deg, var(--rim, rgba(255, 255, 255, 0.08)) 0%, var(--accent-glow, rgba(45, 212, 191, 0.5)) 70%, var(--accent, #2DD4BF) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Subtle top inner highlight line */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

GlowCard.displayName = 'GlowCard';
export default GlowCard;
