/**
 * LifeOS Corner Radii & Concentricity
 * Liquid Glass Specification Section 4.3
 */

export const RADII = {
  chip: 10,
  field: 14,
  tile: 24,
  section: 26,
  hero: 32,
  sheet: 38,
  pill: 999,
} as const;

export const RADII_PX = {
  chip: '10px',
  field: '14px',
  tile: '24px',
  section: '26px',
  hero: '32px',
  sheet: '38px',
  pill: '9999px',
} as const;

/**
 * Concentric Rule: Inner radius = Outer radius - Padding between them
 */
export function getConcentricRadius(outerRadius: number, padding: number): number {
  return Math.max(4, outerRadius - padding);
}
