import React from 'react';

export interface NeuralInfinityIconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Option 3: Neural Infinity Loop
 * Continuous translucent glass infinity loop with luminous neural fiber threads in violet, cyan, and amber.
 */
export function NeuralInfinityIcon({
  size = 22,
  className = '',
  glow = true,
}: NeuralInfinityIconProps) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${glow ? 'drop-shadow-[0_0_12px_rgba(192,132,252,0.6)]' : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Left-to-Right Neural Gradient: Violet -> Cyan -> Amber */}
        <linearGradient
          id={`neural-grad-${uniqueId}`}
          x1="2"
          y1="16"
          x2="30"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="25%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="75%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>

        {/* Outer Glass Shell Rim Gradient */}
        <linearGradient
          id={`glass-rim-${uniqueId}`}
          x1="4"
          y1="8"
          x2="28"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#E9D5FF" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#BAE6FD" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.8" />
        </linearGradient>

        {/* Core Fiber Bright Highlights */}
        <linearGradient
          id={`fiber-core-${uniqueId}`}
          x1="6"
          y1="10"
          x2="26"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#67E8F9" />
          <stop offset="75%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* ── Soft Ambient Glow Behind Infinity Loop ── */}
      <path
        d="M10 10 C6 10 3 13 3 16 C3 19 6 22 10 22 C14 22 18 10 22 10 C26 10 29 13 29 16 C29 19 26 22 22 22 C18 22 14 10 10 10 Z"
        stroke={`url(#neural-grad-${uniqueId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
        filter="blur(2.5px)"
      />

      {/* ── Outer Translucent Glass Tube Body ── */}
      <path
        d="M10 10 C6 10 3 13 3 16 C3 19 6 22 10 22 C14 22 18 10 22 10 C26 10 29 13 29 16 C29 19 26 22 22 22 C18 22 14 10 10 10 Z"
        stroke={`url(#glass-rim-${uniqueId})`}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* ── Primary Neural Stream Core ── */}
      <path
        d="M10 10 C6 10 3 13 3 16 C3 19 6 22 10 22 C14 22 18 10 22 10 C26 10 29 13 29 16 C29 19 26 22 22 22 C18 22 14 10 10 10 Z"
        stroke={`url(#neural-grad-${uniqueId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Inner Filament Thread 1 (Violet-Cyan Phase) ── */}
      <path
        d="M10.5 11.2 C7 11.2 4.2 13.5 4.2 16 C4.2 18.5 7 20.8 10.5 20.8 C14.2 20.8 17.8 11.2 21.5 11.2 C25 11.2 27.8 13.5 27.8 16 C27.8 18.5 25 20.8 21.5 20.8 C17.8 20.8 14.2 11.2 10.5 11.2 Z"
        stroke={`url(#fiber-core-${uniqueId})`}
        strokeWidth="1"
        strokeDasharray="2.5 1.5"
        opacity="0.9"
      />

      {/* ── Inner Filament Thread 2 (Cyan-Amber Phase) ── */}
      <path
        d="M9.5 8.8 C5 8.8 2 12 2 16 C2 20 5 23.2 9.5 23.2 C13.8 23.2 18.2 8.8 22.5 8.8 C27 8.8 30 12 30 16 C30 20 27 23.2 22.5 23.2 C18.2 23.2 13.8 8.8 9.5 8.8 Z"
        stroke={`url(#neural-grad-${uniqueId})`}
        strokeWidth="0.8"
        strokeDasharray="1.5 2"
        opacity="0.65"
      />

      {/* ── Specular Center Crossroads Sparkle ── */}
      <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="3" fill="#38BDF8" opacity="0.4" />
    </svg>
  );
}

export default NeuralInfinityIcon;
