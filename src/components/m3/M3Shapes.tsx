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

/**
 * ── Official Google Material Symbols (Derived from User Reference Images) ──
 */

// 1. Google Material Symbol: "Delete Forever" (Trash can with 'X' in center - Image 4)
export function M3DeleteForeverIcon({
  size = 24,
  className = '',
  color = 'currentColor',
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

// 2. Google Material Symbol: "Edit" (Angled pencil - Image 5)
export function M3EditPencilIcon({
  size = 24,
  className = '',
  color = 'currentColor',
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

// 3. Google Material Symbol: "Save" (Floppy disk with circular hub - Image 6)
export function M3SaveFloppyIcon({
  size = 24,
  className = '',
  color = 'currentColor',
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
    </svg>
  );
}

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
            ease: [0.2, 0, 0, 1],
          },
          scale: {
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <path
          d={M3_CLOVER_PATH}
          fill="none"
          stroke={color}
          strokeWidth="3.2"
          strokeOpacity="0.25"
        />
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
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.svg>
    </div>
  );
}

/**
 * Official Google M3 Expressive Save Symbol Animation
 * Scaled 8-lobed Scallop badge in section theme + Google Floppy Save Symbol + Expanding ripple.
 */
export function M3SaveSymbolAnimation({
  accentColor = 'var(--md-primary, #8436E9)',
  size = 68,
}: {
  accentColor?: string;
  size?: number;
}) {
  const iconSize = Math.round(size * 0.44);

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
          border: `2.5px solid ${accentColor}`,
        }}
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.45, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.05, 0.7, 0.1, 1.0] }}
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
          <path d={M3_SCALLOP_PATH} fill={accentColor} />
        </svg>

        {/* Center Google Material Symbol "save" */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center text-white"
        >
          <M3SaveFloppyIcon size={iconSize} color="#FFFFFF" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Official Google M3 Expressive Edit Symbol Animation
 * Scaled 8-lobed Scallop badge in section theme + Google Edit Pencil Symbol + Writing tilt spring.
 */
export function M3EditSymbolAnimation({
  accentColor = 'var(--md-primary, #8436E9)',
  size = 68,
}: {
  accentColor?: string;
  size?: number;
}) {
  const iconSize = Math.round(size * 0.44);

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
          border: `2.5px solid ${accentColor}`,
        }}
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.45, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.05, 0.7, 0.1, 1.0] }}
      />

      {/* 2. M3 Scallop Badge with Emphasized Spring Scale & Writing Angle */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0, rotate: -30 }}
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
          <path d={M3_SCALLOP_PATH} fill={accentColor} />
        </svg>

        {/* Center Google Material Symbol "edit" with write tilt */}
        <motion.div
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center text-white"
        >
          <M3EditPencilIcon size={iconSize} color="#FFFFFF" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Official Google M3 Expressive Deleted Symbol Animation
 * M3 shape badge in destructive red + Google Delete Forever Symbol (trash with 'X') + particle burst.
 */
export function M3DeleteSymbolAnimation({
  accentColor = '#DC2626',
  size = 68,
}: {
  accentColor?: string;
  size?: number;
}) {
  const iconSize = Math.round(size * 0.44);

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
          <path d={M3_SCALLOP_PATH} fill={accentColor} />
        </svg>

        {/* Center Google Material Symbol "delete_forever" (Trash can with 'X') */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center text-white"
        >
          <M3DeleteForeverIcon size={iconSize} color="#FFFFFF" />
        </motion.div>

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
