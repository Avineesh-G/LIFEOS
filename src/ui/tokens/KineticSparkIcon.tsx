import React from 'react';

export interface KineticSparkIconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Option 2: Kinetic Spark Star
 * Polished chrome 4-point celestial star with a crystal-prism core & electric cyan-violet flare.
 */
export function KineticSparkIcon({
  size = 20,
  className = '',
  glow = true,
}: KineticSparkIconProps) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${glow ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.55)]' : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Crystal Prism Gradient Core */}
        <radialGradient
          id={`prism-core-${uniqueId}`}
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#67E8F9" />
          <stop offset="60%" stopColor="#38BDF8" />
          <stop offset="85%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </radialGradient>

        {/* Polished Chrome Specular Rim Gradient */}
        <linearGradient
          id={`chrome-rim-${uniqueId}`}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="75%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>

        {/* Subtle Inner Ray */}
        <linearGradient
          id={`star-ray-${uniqueId}`}
          x1="16"
          y1="2"
          x2="16"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Outer Soft Aura Glow */}
      <path
        d="M16 2 C16 11 21 16 30 16 C21 16 16 21 16 30 C16 21 11 16 2 16 C11 16 16 11 16 2 Z"
        fill={`url(#prism-core-${uniqueId})`}
        opacity="0.35"
        filter="blur(2px)"
      />

      {/* Main Star Body (Prism Core) */}
      <path
        d="M16 2.5 C16 11.2 20.8 16 29.5 16 C20.8 16 16 20.8 16 29.5 C16 20.8 11.2 16 2.5 16 C11.2 16 16 11.2 16 2.5 Z"
        fill={`url(#prism-core-${uniqueId})`}
      />

      {/* Inner Spark Facet Highlights */}
      <path
        d="M16 5.5 C16 12 19.5 16 26.5 16 C19.5 16 16 20 16 26.5 C16 20 12.5 16 5.5 16 C12.5 16 16 12 16 5.5 Z"
        fill={`url(#star-ray-${uniqueId})`}
        opacity="0.75"
      />

      {/* Polished Chrome Rim Contour */}
      <path
        d="M16 2.5 C16 11.2 20.8 16 29.5 16 C20.8 16 16 20.8 16 29.5 C16 20.8 11.2 16 2.5 16 C11.2 16 16 11.2 16 2.5 Z"
        stroke={`url(#chrome-rim-${uniqueId})`}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Central Supernova Radiant Sparkle */}
      <circle cx="16" cy="16" r="2.2" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="3.5" fill="#E0F2FE" opacity="0.6" />
    </svg>
  );
}

export default KineticSparkIcon;
