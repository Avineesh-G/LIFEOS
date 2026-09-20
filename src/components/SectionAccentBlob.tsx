import React from 'react';
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
 * SectionAccentBlob — Material 3 Expressive Background System
 *
 * Renders as a pre-softened radial-gradient (NO filter: blur).
 * A radial-gradient with 0%→70% soft stop produces equivalent visual
 * softness without triggering GPU blur compositing passes.
 *
 * Rules enforced:
 * - No filter/backdrop-filter of any kind.
 * - No willChange (permanent willChange degrades performance).
 * - Opacity transitions via CSS transition only (not Framer Motion).
 * - Static positioning — no animated layout properties.
 */
export function SectionAccentBlob() {
  const { section, scheme, isDark } = useDayTheme();
  const position = scheme?.blobPosition || 'top-right';
  const coords = POSITION_COORDS[position] || POSITION_COORDS['top-right'];
  // Key changes on section OR dark-mode switch so the new gradient appears
  const key = `${section}-${isDark ? 'dark' : 'light'}`;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          position: 'absolute',
          width: 'clamp(420px, 62vw, 700px)',
          height: 'clamp(420px, 62vw, 700px)',
          borderRadius: '42% 58% 60% 40% / 45% 40% 60% 55%',
          // Pre-softened radial gradient — visually equivalent to blur(75px)
          // but zero GPU compositing cost. Outer stop at 70% creates the
          // same feathered edge that blur would produce.
          background: `radial-gradient(ellipse at center,
            var(--md-accent-blob, #2563EB) 0%,
            color-mix(in srgb, var(--md-accent-blob, #2563EB) 40%, transparent) 40%,
            transparent 70%
          )`,
          opacity: isDark ? 0.32 : 0.22,
          // CSS opacity transition only — no layout, no filter, no paint
          transition: 'opacity 500ms cubic-bezier(0.2, 0, 0, 1)',
          transform: 'translateZ(0)',
          ...coords,
        }}
      />
    </div>
  );
}

export default SectionAccentBlob;
