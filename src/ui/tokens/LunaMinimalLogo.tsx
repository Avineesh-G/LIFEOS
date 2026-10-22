import React from 'react';
import { NeuralInfinityIcon } from './NeuralInfinityIcon';
import { LunaComicBubbleIcon } from './LunaComicBubbleIcon';

export type LunaLogoStyle = 'comic' | 'spark' | 'orbit' | 'halo' | 'infinity';

export interface LunaLogoProps {
  style?: LunaLogoStyle;
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Option 1: Minimal Radiant Spark (Prism Star)
 * Clean, modern 4-point geometric star with soft concave arcs and a crystal-luminous gradient.
 */
export function MinimalRadiantSparkIcon({
  size = 24,
  className = '',
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${glow ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]' : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient
          id={`spark-grad-${uniqueId}`}
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <radialGradient
          id={`spark-core-${uniqueId}`}
          cx="16"
          cy="16"
          r="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Radiant 4-point star path */}
      <path
        d="M16 2.5C16 9.5 9.5 16 2.5 16C9.5 16 16 22.5 16 29.5C16 22.5 22.5 16 29.5 16C22.5 16 16 9.5 16 2.5Z"
        fill={`url(#spark-grad-${uniqueId})`}
      />

      {/* Luminous Inner Core Accent */}
      <circle cx="16" cy="16" r="4.5" fill={`url(#spark-core-${uniqueId})`} />
      <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Option 2: Minimal Orbital Rings (Sync Orbit)
 * Two slender intersecting elliptical orbits with a luminous micro-nucleus.
 */
export function MinimalOrbitalRingsIcon({
  size = 24,
  className = '',
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${glow ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.55)]' : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient
          id={`orbit-grad-1-${uniqueId}`}
          x1="3"
          y1="8"
          x2="29"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient
          id={`orbit-grad-2-${uniqueId}`}
          x1="29"
          y1="8"
          x2="3"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>

      {/* Orbit 1: Tilted Left */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5"
        transform="rotate(-30 16 16)"
        stroke={`url(#orbit-grad-1-${uniqueId})`}
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Orbit 2: Tilted Right */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5"
        transform="rotate(30 16 16)"
        stroke={`url(#orbit-grad-2-${uniqueId})`}
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Luminous Nucleus */}
      <circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="4.5" stroke="#38BDF8" strokeWidth="0.75" strokeOpacity="0.6" />
    </svg>
  );
}

/**
 * Option 3: Minimal Luna Halo (Crescent Aperture)
 * Modern celestial crescent halo with glowing focal apex.
 */
export function MinimalLunaHaloIcon({
  size = 24,
  className = '',
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${glow ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]' : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient
          id={`halo-grad-${uniqueId}`}
          x1="2"
          y1="4"
          x2="30"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* Minimal Outer Crescent Arc */}
      <path
        d="M26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 10.4772 10.4772 6 16 6C18.2575 6 20.3541 6.74959 22.0494 8.0125C19.7891 9.07187 18.2 11.3576 18.2 14C18.2 17.3137 20.8863 20 24.2 20C24.8369 20 25.4452 19.9004 26.0142 19.7161C26.0048 19.8102 26 19.9046 26 20V16Z"
        fill={`url(#halo-grad-${uniqueId})`}
      />

      {/* Floating Center Starlet */}
      <circle cx="21" cy="11" r="2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Unified Luna Logo Component with Style Selection
 */
export function LunaMinimalLogo({
  style = 'comic',
  size = 24,
  className = '',
  glow = true,
}: LunaLogoProps) {
  switch (style) {
    case 'spark':
      return <MinimalRadiantSparkIcon size={size} className={className} glow={glow} />;
    case 'orbit':
      return <MinimalOrbitalRingsIcon size={size} className={className} glow={glow} />;
    case 'halo':
      return <MinimalLunaHaloIcon size={size} className={className} glow={glow} />;
    case 'infinity':
      return <NeuralInfinityIcon size={size} className={className} glow={glow} />;
    case 'comic':
    default:
      return <LunaComicBubbleIcon size={size} className={className} glow={glow} />;
  }
}
