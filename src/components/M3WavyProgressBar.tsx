import React, { useId } from 'react';

interface M3WavyProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  height?: number;
  activeColor?: string;
  trackColor?: string;
}

/**
 * Material 3 Expressive Wavy Progress Bar
 * - Hardware accelerated (GPU compositor) CSS wave animation for 120 FPS buttery smoothness
 * - Ultra-smooth linear/spring cubic-bezier transition on progress width (no stutter or lag)
 * - Lavender fluid sine wave with deep purple inactive track matching Google M3 specs
 */
export default function M3WavyProgressBar({
  progress = 0,
  className = '',
  height = 20,
  activeColor = '#C084FC',
  trackColor = '#581C87',
}: M3WavyProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const wavelength = 24; // pixel period for one full sine cycle
  const amplitude = 3.2;  // vertical wave height
  const centerY = height / 2;
  const strokeWidth = 4.5;
  const rawId = useId();
  const animKey = rawId.replace(/[^a-zA-Z0-9]/g, '');

  // Pre-generate smooth sine wave path across 800px width
  const totalPoints = 800;
  let wavePath = `M 0 ${centerY}`;
  for (let x = 0; x < totalPoints; x += wavelength) {
    const half = wavelength / 2;
    const cpX1 = x + wavelength * 0.18;
    const cpX2 = x + wavelength * 0.32;
    const cpX3 = x + half + wavelength * 0.18;
    const cpX4 = x + half + wavelength * 0.32;

    wavePath += ` C ${cpX1} ${centerY - amplitude * 1.3}, ${cpX2} ${centerY - amplitude * 1.3}, ${x + half} ${centerY}`;
    wavePath += ` C ${cpX3} ${centerY + amplitude * 1.3}, ${cpX4} ${centerY + amplitude * 1.3}, ${x + wavelength} ${centerY}`;
  }

  const remainingPercent = Math.max(0, 100 - clampedProgress);

  return (
    <div
      className={`relative w-full flex items-center select-none overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <style>{`
        @keyframes m3WaveGlide_${animKey} {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-${wavelength}px, 0, 0); }
        }
        .m3-wave-active-${animKey} {
          animation: m3WaveGlide_${animKey} 0.85s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* 1. Active Animated Wavy Section */}
      <div
        className="h-full overflow-hidden flex items-center"
        style={{
          width: `${clampedProgress}%`,
          transition: 'width 180ms cubic-bezier(0.2, 0, 0, 1)',
          willChange: 'width',
        }}
      >
        <div className={`h-full flex items-center m3-wave-active-${animKey}`} style={{ width: '800px' }}>
          <svg
            className="h-full overflow-visible"
            style={{ width: '800px' }}
            viewBox={`0 0 800 ${height}`}
          >
            <path
              d={wavePath}
              fill="none"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 2. Gap & Inactive Straight Rounded Track */}
      {remainingPercent > 1.5 && (
        <div
          className="h-full flex items-center pl-1.5 flex-1"
          style={{
            transition: 'width 180ms cubic-bezier(0.2, 0, 0, 1)',
            willChange: 'width',
          }}
        >
          <div
            className="w-full rounded-full"
            style={{
              height: `${strokeWidth}px`,
              backgroundColor: trackColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
