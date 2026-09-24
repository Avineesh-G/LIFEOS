import React from 'react';
import { motion } from 'framer-motion';

/**
 * Material 3 Expressive Shape Paths
 * Derived directly from Google's official 35-shape M3 Expressive catalog.
 */

// 4-Lobed Clover / Blossom (Signature M3 Expressive Progress & Loading Geometry)
export const M3_CLOVER_PATH =
  'M 24,4 C 30,4 34,8 34,14 C 40,14 44,18 44,24 C 44,30 40,34 34,34 C 34,40 30,44 24,44 C 18,44 14,40 14,34 C 8,34 4,30 4,24 C 4,18 8,14 14,14 C 14,8 18,4 24,4 Z';

// 8-Lobed Scallop / Cookie (Signature M3 Expressive Badge & Confirmation Geometry)
export const M3_SCALLOP_PATH =
  'M 24,2 C 28,2 30,5 33,7 C 36,9 39,9 41,12 C 43,15 43,18 45,21 C 47,24 47,26 45,29 C 43,32 43,35 41,38 C 39,41 36,41 33,43 C 30,45 28,48 24,48 C 20,48 18,45 15,43 C 12,41 9,41 7,38 C 5,35 5,32 3,29 C 1,26 1,24 3,21 C 5,18 5,15 7,12 C 9,9 12,9 15,7 C 18,5 20,2 24,2 Z';

// M3 Squircle (Superellipse with continuous curvature)
export const M3_SQUIRCLE_PATH =
  'M 24,2 C 38,2 46,10 46,24 C 46,38 38,46 24,46 C 10,46 2,38 2,24 C 2,10 10,2 24,2 Z';

interface M3ShapeProps {
  fill?: string;
  className?: string;
  size?: number;
}

/**
 * 4-Lobed Clover Shape (M3 Expressive)
 */
export function M3CloverShape({ fill = 'currentColor', className = '', size = 24 }: M3ShapeProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={M3_CLOVER_PATH} />
    </svg>
  );
}

/**
 * 8-Lobed Scallop Shape (M3 Expressive)
 */
export function M3ScallopShape({ fill = 'currentColor', className = '', size = 24 }: M3ShapeProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={M3_SCALLOP_PATH} />
    </svg>
  );
}

/**
 * Official Google M3 Expressive Rotating Progress Indicator
 * Features the signature 4-lobed clover morphing and spinning with M3 decelerated spring physics.
 */
export function M3ProgressIndicator({
  color = 'var(--md-primary, #8436E9)',
  size = 28,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer morphing clover with smooth rotation */}
      <motion.svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="overflow-visible"
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 0.92, 1],
        }}
        transition={{
          rotate: {
            duration: 1.8,
            repeat: Infinity,
            ease: [0.2, 0, 0, 1], // M3 Standard Decelerate
          },
          scale: {
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {/* Soft background shape glow */}
        <path
          d={M3_CLOVER_PATH}
          fill="none"
          stroke={color}
          strokeWidth="3.2"
          strokeOpacity="0.25"
        />

        {/* Dynamic active stroke with stroke-dashoffset morphing */}
        <motion.path
          d={M3_CLOVER_PATH}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="40 90"
          animate={{
            strokeDashoffset: [0, -130],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: [0.4, 0.0, 0.2, 1], // M3 Emphasized
          }}
        />
      </motion.svg>

      {/* Center dynamic pulsing dot */}
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [0.7, 1.3, 0.7],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

/**
 * Official Google M3 Expressive Save / Edit Feedback Symbol Animation
 * Scaled 8-lobed Scallop badge in the interface's color + drawn checkmark + subtle expanding ripple.
 */
export function M3SaveSymbolAnimation({
  accentColor = 'var(--md-primary, #8436E9)',
  size = 64,
}: {
  accentColor?: string;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* 1. M3 Expanding Echo Ripple Ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          border: `2px solid ${accentColor}`,
        }}
        initial={{ scale: 0.7, opacity: 0.9 }}
        animate={{ scale: 1.45, opacity: 0 }}
        transition={{ duration: 0.65, ease: [0.05, 0.7, 0.1, 1.0] }}
      />

      {/* 2. M3 Scallop Badge with Emphasized Spring Scale & Rotation */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 22,
          mass: 0.7,
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Scallop fill */}
          <path d={M3_SCALLOP_PATH} fill={accentColor} />

          {/* Animated checkmark path drawing with spring timing */}
          <motion.path
            d="M 14 24 L 21 31 L 34 17"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.38,
              delay: 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * Official Google M3 Expressive Deleted Symbol Animation
 * M3 shape badge in destructive / interface color, with lifting lid, dispersing particle burst,
 * and a crisp cancellation slash.
 */
export function M3DeleteSymbolAnimation({
  accentColor = '#DC2626',
  size = 64,
}: {
  accentColor?: string;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* 1. Destructive Expanding Shockwave */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: accentColor,
        }}
        initial={{ scale: 0.6, opacity: 0.35 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.05, 0.7, 0.1, 1.0] }}
      />

      {/* 2. M3 Scallop / Burst Container */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0.2, rotate: 20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 440,
          damping: 24,
          mass: 0.7,
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Scallop Background */}
          <path d={M3_SCALLOP_PATH} fill={accentColor} />

          {/* Animated Trash Lid: lifts and tilts upward */}
          <motion.path
            d="M 15 17 L 33 17 M 21 17 L 21 14 C 21 13 22 12.5 23 12.5 L 25 12.5 C 26 12.5 27 13 27 14 L 27 17"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            initial={{ y: 0, rotate: 0 }}
            animate={{ y: -5, rotate: -24, originX: 0.3, originY: 0.4 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 18,
              delay: 0.08,
            }}
          />

          {/* Animated Trash Can Body */}
          <motion.path
            d="M 18 18 L 19.5 32 C 19.8 34 21 35.5 23 35.5 L 25 35.5 C 27 35.5 28.2 34 28.5 32 L 30 18"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: [1, 0.88, 1] }}
            transition={{ duration: 0.35, delay: 0.1 }}
          />

          {/* Diagonal M3 strike / cancellation slash */}
          <motion.path
            d="M 13 35 L 35 13"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </svg>

        {/* 3. Dispersing Particle Dots */}
        {[
          { x: -22, y: -18 },
          { x: 22, y: -16 },
          { x: -24, y: 14 },
          { x: 24, y: 16 },
          { x: 0, y: -26 },
          { x: 0, y: 26 },
        ].map((pt, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full w-1.5 h-1.5"
            style={{ backgroundColor: accentColor }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: pt.x,
              y: pt.y,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.52,
              delay: 0.15 + i * 0.03,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
