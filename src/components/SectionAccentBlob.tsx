import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDayTheme } from '../theme/DayThemeProvider';
import { BlobPosition } from '../theme/sectionSeedColors';

interface BlobCoord {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

const POSITION_COORDS: Record<BlobPosition, BlobCoord> = {
  'top-right': { top: '-14vw', right: '-14vw' },
  'bottom-left': { bottom: '-14vw', left: '-14vw' },
  'top-left': { top: '-14vw', left: '-14vw' },
  'bottom-right': { bottom: '-14vw', right: '-14vw' },
  'top-center': { top: '-16vw', left: '20vw' },
};

/**
 * SectionAccentBlob (Part A & B: Material 3 Expressive Background System)
 * 
 * Each interface features exactly one soft-edged organic blob:
 * - Irregular blob shape: border-radius 42% 58% 60% 40% / 45% 40% 60% 55%
 * - Filled with the seed color at ~14% opacity in light mode / ~20% in dark mode
 * - Positioned bleeding off the designated screen edge
 * - Blur 75px, sits behind all content (z-0, pointer-events-none)
 */
export function SectionAccentBlob() {
  const { section, scheme, isDark } = useDayTheme();
  const position = scheme?.blobPosition || 'top-right';
  const coords = POSITION_COORDS[position] || POSITION_COORDS['top-right'];

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0" 
      aria-hidden="true"
      style={{ contain: 'strict' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${section}-${position}-${isDark ? 'dark' : 'light'}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: isDark ? 0.20 : 0.14, 
            scale: 1,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.2, 0, 0, 1] 
          }}
          style={{
            position: 'absolute',
            width: 'clamp(420px, 62vw, 700px)',
            height: 'clamp(420px, 62vw, 700px)',
            borderRadius: '42% 58% 60% 40% / 45% 40% 60% 55%',
            backgroundColor: 'var(--md-accent-blob, #2563EB)',
            filter: 'blur(75px)',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
            ...coords,
          }}
        />
      </AnimatePresence>
    </div>
  );
}

export default SectionAccentBlob;
