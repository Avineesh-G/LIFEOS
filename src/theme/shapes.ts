/**
 * Material 3 Expressive Shape Catalog (v2)
 * Based on Google's 35-shape M3 Expressive catalog.
 * 
 * Explicit Rule: Assign each shape family to a specific, named component:
 * - Circle: Icon-only buttons, avatar, FAB
 * - Squircle: Icon badges, bookmark button, app icon tile
 * - Pill / Stadium: Nav tabs, filter chips, segmented choices
 * - Scallop / Cookie / Burst: Streak badge, achievement/milestone markers ONLY
 * - Clamshell / Arch: Bottom sheet handles, section dividers
 * - Flex / Split: Dual-action rows (e.g. quote action pill + squircle bookmark)
 * - Asymmetric card: Hero/greeting card only (signature shape)
 * - Standard content cards: Plain rounded-rect (12-16px) as the quiet baseline
 */

export const M3_SHAPES = {
  // 1. Circle
  circle: 'rounded-full',

  // 2. Squircle (Superellipse, softer than rounded-square)
  squircleSm: 'rounded-[16px]',
  squircleMd: 'rounded-[20px]',
  squircleLg: 'rounded-[24px]',
  squircleXl: 'rounded-[28px]',

  // 3. Pill / Stadium
  pill: 'rounded-full',
  pillSm: 'rounded-full px-3 py-1',
  pillMd: 'rounded-full px-4 py-2',
  pillLg: 'rounded-full px-6 py-3',

  // 4. Clamshell / Arch (Half-circle top, flat bottom)
  clamshellTop: 'rounded-t-[32px] rounded-b-none',
  clamshellBottom: 'rounded-b-[32px] rounded-t-none',

  // 5. Flex / Split Container (Asymmetric two-zone container)
  flexSplitContainer: 'flex items-center gap-2 p-1.5 rounded-[24px]',

  // 6. Asymmetric Card (Signature hero greeting card only)
  asymmetricHero: 'rounded-tl-[36px] rounded-tr-[20px] rounded-br-[36px] rounded-bl-[24px]',

  // 7. Standard Content Baseline (Quiet baseline: 12-16px)
  standardCard: 'rounded-[16px]',
  standardCardSm: 'rounded-[12px]',
  standardCardLg: 'rounded-[20px]',
} as const;

/**
 * 8-Point Scallop / Burst SVG Polygon coordinates (for Streak & Milestone Badges)
 * Normalized to 0 0 100 100 viewBox
 */
export const BURST_PATH_8_POINT = `
  M 50,0
  L 62,20
  L 85,15
  L 80,38
  L 100,50
  L 80,62
  L 85,85
  L 62,80
  L 50,100
  L 38,80
  L 15,85
  L 20,62
  L 0,50
  L 20,38
  L 15,15
  L 38,20
  Z
`.replace(/\s+/g, ' ').trim();

/**
 * CSS clip-path for 8-point burst
 */
export const BURST_CLIP_PATH = 'polygon(50% 0%, 62% 20%, 85% 15%, 80% 38%, 100% 50%, 80% 62%, 85% 85%, 62% 80%, 50% 100%, 38% 80%, 15% 85%, 20% 62%, 0% 50%, 20% 38%, 15% 15%, 38% 20%)';
