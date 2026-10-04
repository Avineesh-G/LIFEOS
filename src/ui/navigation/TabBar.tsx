import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { MOTION_SPRINGS } from '../tokens/motion';

export interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  tint?: string;
}

export interface TabBarProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  onAiClick?: () => void;
  className?: string;
}

export function TabBar({
  items,
  activeKey,
  onChange,
  onAiClick,
  className = '',
}: TabBarProps) {
  // Ultra-smooth continuous metaball contour
  const metaballPath =
    'M 27 3 L 195 3 C 210 3, 218 17, 228 17 C 238 17, 246 3, 256 3 A 25 25 0 0 1 256 53 C 246 53, 238 39, 228 39 C 218 39, 210 53, 195 53 L 27 53 A 25 25 0 0 1 27 3 Z';

  return (
    <div className={`relative flex items-center justify-center pointer-events-auto select-none ${className}`}>
      {/* ── Unified Minimal Liquid Glass Metaball Vessel ── */}
      <div className="relative w-[286px] h-[56px] flex items-center">
        {/* Continuous Fluid SVG Chassis */}
        <svg
          viewBox="0 0 286 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_12px_32px_rgba(0,0,0,0.88)]"
        >
          <defs>
            {/* Soft, Low-Contrast Liquid Refraction Gradient */}
            <linearGradient id="softRefractionGlow" x1="150" y1="40" x2="282" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00A3FF" stopOpacity="0" />
              <stop offset="25%" stopColor="#00A3FF" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#8B5CF6" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#C084FC" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0.6" />
            </linearGradient>

            {/* Specular Top Rim Gradient */}
            <linearGradient id="specularRim" x1="0" y1="0" x2="286" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="78%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="92%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
            </linearGradient>

            {/* Vessel Clip Path */}
            <clipPath id="metaballClip">
              <path d={metaballPath} />
            </clipPath>
          </defs>

          {/* Unified Glass Background Fill */}
          <path
            d={metaballPath}
            fill="rgba(26, 26, 28, 0.88)"
            className="backdrop-blur-2xl"
          />

          {/* Refraction Wave: Soft, low-contrast diffuse ambient glow */}
          <g clipPath="url(#metaballClip)">
            <path
              d="M 140 53 C 170 53, 188 44, 206 41 C 218 36, 238 36, 250 41 C 265 47, 278 40, 281 28 A 25 25 0 0 1 256 53 C 246 53, 238 39, 228 39 C 218 39, 210 53, 195 53 L 140 53 Z"
              fill="url(#softRefractionGlow)"
              opacity="0.75"
              filter="blur(6px)"
            />
            <path
              d="M 150 53 C 175 53, 192 46, 208 43 C 219 38, 237 38, 248 43 C 262 48, 276 41, 281 28 A 25 25 0 0 1 256 53 C 246 53, 238 39, 228 39 C 218 39, 210 53, 195 53 L 150 53 Z"
              fill="url(#softRefractionGlow)"
              opacity="0.85"
              filter="blur(2px)"
            />
          </g>

          {/* Clean Single Seamless Outer Border */}
          <path
            d={metaballPath}
            stroke="rgba(255, 255, 255, 0.14)"
            strokeWidth="1.1"
          />

          {/* Top Specular Rim Reflection */}
          <path
            d="M 27 3 L 195 3 C 210 3, 218 17, 228 17 C 238 17, 246 3, 256 3 A 25 25 0 0 1 281 28"
            stroke="url(#specularRim)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>

        {/* ── Left Region: Seamless Navigation Tabs ── */}
        <div className="absolute left-1.5 top-1.5 w-[190px] h-[44px] flex items-center px-1 z-10">
          {items.map((tab) => {
            const isSelected = tab.key === activeKey;
            const tint = tab.tint || '#0A84FF';

            return (
              <button
                key={tab.key}
                type="button"
                aria-label={tab.label}
                onClick={() => {
                  triggerHaptic('selection');
                  onChange(tab.key);
                }}
                className="relative flex-1 min-w-0 h-[38px] rounded-full flex items-center justify-center select-none cursor-pointer transition-colors z-10 px-1"
                style={{ color: isSelected ? tint : 'rgba(235, 235, 245, 0.65)' }}
              >
                <div className="flex items-center justify-center text-[22px] shrink-0">
                  {isSelected ? tab.activeIcon : tab.icon}
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="tabbar-active-thumb"
                    className="absolute inset-0 bg-white/[0.10] rounded-full -z-10 shadow-sm"
                    transition={MOTION_SPRINGS.snappy}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Right Region: Pure Sparkle AI Pod Icon ── */}
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-auto"
          style={{ left: '231px', top: '3px', width: '50px', height: '50px' }}
        >
          <motion.button
            type="button"
            aria-label="Ask AI"
            whileTap={{ scale: 0.90 }}
            transition={MOTION_SPRINGS.bouncy}
            onClick={() => {
              triggerHaptic('medium');
              onAiClick?.();
            }}
            className="relative w-full h-full rounded-full flex items-center justify-center cursor-pointer group select-none"
          >
            {/* Sparkle Icon centered inside the circular glass pod */}
            <div className="relative z-10 flex items-center justify-center pointer-events-none">
              <Sparkle size={21} weight="fill" className="text-white drop-shadow-[0_2px_8px_rgba(192,132,252,0.6)]" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
