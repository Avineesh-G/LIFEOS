/**
 * Material 3 Expressive Dual Elevation System (v2)
 * Combines tonal shift (rising surface tone) + subtle shadow elevation together.
 * 
 * Levels:
 * - Level 0: Screen background (none)
 * - Level 1: Standard content cards (+2 tone, 0 1px 2px rgba(0,0,0,.08))
 * - Level 2: Stat widgets, reminder cards (+4 tone, 0 2px 6px rgba(0,0,0,.12))
 * - Level 3: FAB, active/pressed card, bottom dock (+6 tone, 0 6px 16px rgba(0,0,0,.16))
 * - Level 4: Modals, bottom sheets (+8 tone, 0 12px 28px rgba(0,0,0,.20))
 */

export interface ElevationLevel {
  shadow: string;
  shadowClass: string;
  tonalStep: number;
  containerRole: string;
}

export const M3_ELEVATION = {
  level0: {
    shadow: 'none',
    shadowClass: 'shadow-none',
    tonalStep: 0,
    containerRole: 'var(--md-surface)',
  },
  level1: {
    shadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
    shadowClass: 'shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
    tonalStep: 2,
    containerRole: 'var(--md-surface-container-low)',
  },
  level2: {
    shadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
    shadowClass: 'shadow-[0_2px_6px_rgba(0,0,0,0.12)]',
    tonalStep: 4,
    containerRole: 'var(--md-surface-container)',
  },
  level3: {
    shadow: '0 6px 16px rgba(0, 0, 0, 0.16)',
    shadowClass: 'shadow-[0_6px_16px_rgba(0,0,0,0.16)]',
    tonalStep: 6,
    containerRole: 'var(--md-surface-container-high)',
  },
  level4: {
    shadow: '0 12px 28px rgba(0, 0, 0, 0.20)',
    shadowClass: 'shadow-[0_12px_28px_rgba(0,0,0,0.20)]',
    tonalStep: 8,
    containerRole: 'var(--md-surface-container-highest)',
  },
} as const;
