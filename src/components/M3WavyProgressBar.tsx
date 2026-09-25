import React, { useId, useMemo } from 'react';

interface M3WavyProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  width?: number; // total width in px (default: 240)
  height?: number; // total height in px (default: 28)
  activeColor?: string; // primary wave color (default: Royal Blue #2563EB)
  secondaryColor?: string; // gradient end color (default: Sky Blue #60A5FA)
  trackColor?: string; // optional background track color (ignored on greeting)
  showTrack?: boolean; // default: false (no background track per greeting spec)
}

/**
 * Material 3 Expressive Refined Wavy Progress Indicator
 *
 * Designed for 100% vector sharpness and zero pixelation:
 * - Pure SVG <clipPath> (hardware vector stencil, avoiding Skia bitmap mask rasterization).
 * - Smooth 4-quarter cubic bezier sine path with continuous second derivatives (no kinks/lumps).
 * - Direct vector stroke gradient with opacity taper at the leading tip (no hard dot, smooth point).
 * - Lazy 3.2s ripple cycle matching M3 Expressive specifications.
 * - Settles gracefully from 88% to 100% into a calm, flat line.
 */
export default function M3WavyProgressBar({
  progress = 0,
  className = '',
  width = 240,
  height = 28,
  activeColor = '#2563EB',
  secondaryColor = '#60A5FA',
}: M3WavyProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, '');

  const wavelength = 56; // wide, elegant wavelength for fluid ripple
  const centerY = height / 2;
  const strokeWidth = 3.5;

  // Amplitude stays gently visible (3.8px) through 88%, then gracefully settles to 0 in the last 12%
  const baseAmplitude = 3.8;
  const amplitude = clampedProgress <= 88
    ? baseAmplitude
    : baseAmplitude * Math.max(0, (100 - clampedProgress) / 12);

  // Generate mathematically exact 4-quarter-bezier sine wave path
  const wavePath = useMemo(() => {
    const totalSpan = width + wavelength * 2;
    const L = wavelength / 4; // quarter period
    let d = `M 0 ${centerY}`;

    for (let x = 0; x < totalSpan; x += wavelength) {
      if (amplitude <= 0.05) {
        // When settled, draw a calm straight line
        d += ` L ${x + wavelength} ${centerY}`;
      } else {
        // Quarter 1: (0 -> peak -A)
        d += ` C ${x + L * 0.3642} ${centerY - amplitude * 0.5708}, ${x + L * 0.6358} ${centerY - amplitude}, ${x + L} ${centerY - amplitude}`;
        // Quarter 2: (peak -A -> 0)
        d += ` C ${x + L + L * 0.3642} ${centerY - amplitude}, ${x + L + L * 0.6358} ${centerY - amplitude * 0.5708}, ${x + 2 * L} ${centerY}`;
        // Quarter 3: (0 -> trough +A)
        d += ` C ${x + 2 * L + L * 0.3642} ${centerY + amplitude * 0.5708}, ${x + 2 * L + L * 0.6358} ${centerY + amplitude}, ${x + 3 * L} ${centerY + amplitude}`;
        // Quarter 4: (trough +A -> 0)
        d += ` C ${x + 3 * L + L * 0.3642} ${centerY + amplitude}, ${x + 3 * L + L * 0.6358} ${centerY + amplitude * 0.5708}, ${x + 4 * L} ${centerY}`;
      }
    }
    return d;
  }, [width, wavelength, centerY, amplitude]);

  // Current active pixel width of the wave
  const activeWidth = (clampedProgress / 100) * width;
  const taperLength = Math.min(20, Math.max(6, activeWidth * 0.3));
  const taperStartRatio = activeWidth > 0
    ? Math.max(0, (activeWidth - taperLength) / activeWidth)
    : 0;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <style>{`
        @keyframes m3Ripple_${safeId} {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-${wavelength}px, 0, 0); }
        }
        .m3-wave-track-${safeId} {
          animation: m3Ripple_${safeId} 3.2s linear infinite;
          will-change: transform;
        }
      `}</style>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="geometricPrecision"
        className="overflow-hidden"
      >
        <defs>
          {/* Pure Vector Clip: Masks the wave to activeWidth without bitmap rasterization */}
          <clipPath id={`m3VectorClip_${safeId}`}>
            <rect
              x="0"
              y="0"
              width={activeWidth}
              height={height}
            />
          </clipPath>

          {/* Stroke gradient: Smooth transition with transparent fade at the leading edge */}
          <linearGradient
            id={`m3StrokeGrad_${safeId}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={Math.max(1, activeWidth)}
            y2="0"
          >
            <stop offset="0%" stopColor={activeColor} stopOpacity="1" />
            <stop offset={`${taperStartRatio * 100}%`} stopColor={secondaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Active Animated Wave (No Background Track) */}
        {clampedProgress > 0 && (
          <g clipPath={`url(#m3VectorClip_${safeId})`}>
            <g className={`m3-wave-track-${safeId}`}>
              <path
                d={wavePath}
                fill="none"
                stroke={`url(#m3StrokeGrad_${safeId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

