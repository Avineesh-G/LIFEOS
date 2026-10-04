/**
 * LifeOS Typography Metrics
 * Liquid Glass Specification Section 4.2 (iOS Metrics with Inter Variable)
 */

export interface TypographyToken {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing: string;
  fontFamily?: string;
  fontVariantNumeric?: string;
}

export const TYPOGRAPHY = {
  largeTitle: {
    fontSize: '34px',
    lineHeight: '41px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  title1: {
    fontSize: '28px',
    lineHeight: '34px',
    fontWeight: 700,
    letterSpacing: '-0.015em',
  },
  title2: {
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  title3: {
    fontSize: '20px',
    lineHeight: '25px',
    fontWeight: 600,
    letterSpacing: '-0.005em',
  },
  headline: {
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: 600,
    letterSpacing: '0',
  },
  body: {
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: 400,
    letterSpacing: '0',
  },
  callout: {
    fontSize: '16px',
    lineHeight: '21px',
    fontWeight: 400,
    letterSpacing: '0',
  },
  subhead: {
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0',
  },
  footnote: {
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: 400,
    letterSpacing: '0',
  },
  caption: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
    letterSpacing: '0',
  },
  displayNumeral: {
    fontSize: '64px',
    lineHeight: '72px',
    fontWeight: 600,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
  },
  displayNumeralLarge: {
    fontSize: '80px',
    lineHeight: '88px',
    fontWeight: 600,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
  },
} as const;

export type TypographyStyle = keyof typeof TYPOGRAPHY;
