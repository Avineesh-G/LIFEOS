import { DayPhase } from '../hooks/useDayPhase';

/**
 * Minimum weight guardrails to ensure legibility and contrast across all day phases.
 * Clash Display must never drop below 550.
 * Satoshi must never drop below 400.
 */
export const MIN_HEADING_WEIGHT = 550;
export const MIN_BODY_WEIGHT = 400;

/**
 * Compute heading font weight (Clash Display variable) based on day phase and progress.
 *
 * Weight scale:
 * - Dawn: 600 -> 650 (rising)
 * - Morning: 650 -> 700 (rising)
 * - Afternoon: 700 (held steady at peak)
 * - Dusk: 700 -> 600 (falling)
 * - Evening: 600 -> 550 (falling)
 * - Night: 550 (held, lowest)
 */
export function getHeadingWeight(phase: DayPhase, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  let weight = 600;

  switch (phase) {
    case 'dawn':
      weight = 600 + (650 - 600) * p;
      break;
    case 'morning':
      weight = 650 + (700 - 650) * p;
      break;
    case 'afternoon':
      weight = 700;
      break;
    case 'dusk':
      weight = 700 + (600 - 700) * p;
      break;
    case 'evening':
      weight = 600 + (550 - 600) * p;
      break;
    case 'night':
      weight = 550;
      break;
    default:
      weight = 600;
  }

  return Math.max(MIN_HEADING_WEIGHT, Math.round(weight));
}

/**
 * Compute body font weight (Satoshi variable) based on day phase and progress.
 *
 * Weight scale:
 * - Dawn: 400 (held)
 * - Morning: 400 -> 450 (rising)
 * - Afternoon: 450 (peak, held)
 * - Dusk: 450 -> 400 (falling)
 * - Evening: 400 (held)
 * - Night: 400 (held)
 */
export function getBodyWeight(phase: DayPhase, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  let weight = 400;

  switch (phase) {
    case 'dawn':
      weight = 400;
      break;
    case 'morning':
      weight = 400 + (450 - 400) * p;
      break;
    case 'afternoon':
      weight = 450;
      break;
    case 'dusk':
      weight = 450 + (400 - 450) * p;
      break;
    case 'evening':
      weight = 400;
      break;
    case 'night':
      weight = 400;
      break;
    default:
      weight = 400;
  }

  return Math.max(MIN_BODY_WEIGHT, Math.round(weight));
}

/**
 * Returns both typography density tokens for a given phase and progress.
 */
export function getTypographyTokens(phase: DayPhase, progress: number) {
  return {
    headingWeight: getHeadingWeight(phase, progress),
    bodyWeight: getBodyWeight(phase, progress),
  };
}
