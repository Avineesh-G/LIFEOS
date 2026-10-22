import React from 'react';

export interface LunaComicBubbleIconProps {
  size?: number;
  className?: string;
  glow?: boolean;
  variant?: 'outline' | 'filled' | 'glass';
  color?: string;
}

/**
 * Luna Comic Bubble Icon:
 * Minimal 8-point geometric starburst conversation bubble with a sharp speech pointer tail.
 * Clean, normal monochrome icon matching the application design system.
 */
export function LunaComicBubbleIcon({
  size = 24,
  className = '',
  color = 'currentColor',
  variant = 'outline',
}: LunaComicBubbleIconProps) {
  // Exact refined coordinates for the 8-point comic starburst speech bubble (32x32 viewport)
  const bubblePath =
    'M 16.0 2.5 ' +
    'L 19.2 7.6 ' +
    'L 25.0 5.8 ' +
    'L 23.4 12.0 ' +
    'L 29.0 15.0 ' +
    'L 23.4 18.2 ' +
    'L 27.5 28.5 ' + // Speech bubble tail tip
    'L 19.2 22.2 ' + // Speech bubble inner return notch
    'L 16.0 27.8 ' +
    'L 12.8 22.4 ' +
    'L 6.8 24.2 ' +
    'L 8.6 18.2 ' +
    'L 3.0 15.0 ' +
    'L 8.6 12.0 ' +
    'L 6.8 5.8 ' +
    'L 12.8 7.6 ' +
    'Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Optional subtle translucent glass fill */}
      {variant !== 'outline' && (
        <path
          d={bubblePath}
          fill={color}
          fillOpacity={0.12}
        />
      )}

      {/* Clean crisp outline stroke matching user reference */}
      <path
        d={bubblePath}
        stroke={color}
        strokeWidth="2.3"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default LunaComicBubbleIcon;
