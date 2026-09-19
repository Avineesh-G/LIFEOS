/**
 * Pixel-Style Application Typography System
 * 
 * Grounded in the Pixel notification UI specification:
 * - Single typeface: Google Sans Flex
 * - Strict 4-weight system: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold rare emphasis)
 * - Restrained letter spacing and comfortable line height
 * - 4-level tonal text hierarchy (#F2F3F5 primary, #B8BBC3 secondary, #858994 tertiary, #5F626B disabled)
 */

export interface PixelTextStyle {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  fontVariationSettings?: string;
  fontVariantNumeric?: string;
}

export const FONT_STACK_GOOGLE_SANS_FLEX = '"Google Sans Flex", sans-serif';

/**
 * Core Typography Tokens
 */
export const TYPOGRAPHY_TOKENS = {
  fontFamilyPrimary: FONT_STACK_GOOGLE_SANS_FLEX,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
} as const;

/**
 * 4-Level Tonal Hierarchy
 */
export const TEXT_TONAL_DARK = {
  primary: '#F2F3F5',
  secondary: '#B8BBC3',
  tertiary: '#858994',
  disabled: '#5F626B',
} as const;

export const TEXT_TONAL_LIGHT = {
  primary: '#1E2024',
  secondary: '#575B66',
  tertiary: '#808593',
  disabled: '#A6ABB8',
} as const;

/**
 * Complete Application Type Scale
 */
export const PIXEL_TYPE_SCALE = {
  // 1. Display: 44px / 48px / 600 / -0.6px (Hero / large dashboard statements)
  display: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '44px',
    lineHeight: '48px',
    fontWeight: 600,
    letterSpacing: '-0.6px',
    fontVariationSettings: "'wght' 600, 'wdth' 100, 'opsz' 44, 'ROND' 55",
  },

  // 2. Page Title: 30px / 36px / 600 / -0.25px (Primary screen title)
  pageTitle: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '30px',
    lineHeight: '36px',
    fontWeight: 600,
    letterSpacing: '-0.25px',
    fontVariationSettings: "'wght' 600, 'wdth' 100, 'opsz' 30, 'ROND' 55",
  },

  // 3. Section Heading: 22px / 28px / 600 / 0 (Major sections inside a page)
  sectionHeading: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 600,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 600, 'wdth' 100, 'opsz' 22, 'ROND' 50",
  },

  // 4. Card Title: 18px / 24px / 500 / 0 (Cards, panels, notification-like components)
  cardTitle: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: 500,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 500, 'wdth' 100, 'opsz' 18, 'ROND' 50",
  },

  // 5. Card Description: 15px / 22px / 400 / 0
  cardDescription: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '15px',
    lineHeight: '22px',
    fontWeight: 400,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 400, 'wdth' 100, 'opsz' 15, 'ROND' 40",
  },

  // 6. Body Text: 16px / 24px / 400 / 0 (Normal application content)
  body: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 400,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 400, 'wdth' 100, 'opsz' 16, 'ROND' 40",
  },

  // 7. Secondary Body: 14px / 20px / 400 / 0 (Supporting descriptions, metadata)
  secondaryBody: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 400, 'wdth' 100, 'opsz' 14, 'ROND' 40",
  },

  // 8. Labels: 13px / 18px / 500 / 0.05px (Small structural/UI text)
  labels: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: 500,
    letterSpacing: '0.05px',
    fontVariationSettings: "'wght' 500, 'wdth' 100, 'opsz' 13, 'ROND' 45",
  },

  // 9. Button Text: 15px / 20px / 500 / 0 (Clean, non-700-weight buttons)
  button: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 500, 'wdth' 100, 'opsz' 15, 'ROND' 50",
  },

  // 10. Navigation: 14px / 20px / 500 / 0
  navigation: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 500, 'wdth' 100, 'opsz' 14, 'ROND' 50",
  },

  // 11. Statistics / Important Numbers: 28px / 32px / 600 / -0.2px
  stat: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '28px',
    lineHeight: '32px',
    fontWeight: 600,
    letterSpacing: '-0.2px',
    fontVariantNumeric: 'tabular-nums',
    fontVariationSettings: "'wght' 600, 'wdth' 100, 'opsz' 28, 'ROND' 45",
  },

  // 12. Large Dashboard Metrics: 32px / 36px / 600 / -0.3px
  statLarge: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '32px',
    lineHeight: '36px',
    fontWeight: 600,
    letterSpacing: '-0.3px',
    fontVariantNumeric: 'tabular-nums',
    fontVariationSettings: "'wght' 600, 'wdth' 100, 'opsz' 32, 'ROND' 45",
  },

  // 13. Metadata: 13px / 18px / 400 / 0
  metadata: {
    fontFamily: FONT_STACK_GOOGLE_SANS_FLEX,
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: 400,
    letterSpacing: '0px',
    fontVariationSettings: "'wght' 400, 'wdth' 100, 'opsz' 13, 'ROND' 40",
  },
} as const;

// Backward-compatible alias for existing components
export const M3_TYPESCALE = {
  heroTitle: PIXEL_TYPE_SCALE.display,
  pageHeading: PIXEL_TYPE_SCALE.pageTitle,
  sectionHeading: PIXEL_TYPE_SCALE.sectionHeading,
  bodyText: PIXEL_TYPE_SCALE.body,
  secondaryText: PIXEL_TYPE_SCALE.secondaryBody,
  buttons: PIXEL_TYPE_SCALE.button,
  navLabels: PIXEL_TYPE_SCALE.navigation,
  numbersStats: PIXEL_TYPE_SCALE.stat,
  smallLabels: PIXEL_TYPE_SCALE.labels,
  captions: PIXEL_TYPE_SCALE.metadata,
  displayL: PIXEL_TYPE_SCALE.display,
  headlineL: PIXEL_TYPE_SCALE.pageTitle,
  titleL: PIXEL_TYPE_SCALE.sectionHeading,
  bodyL: PIXEL_TYPE_SCALE.body,
  labelL: PIXEL_TYPE_SCALE.labels,
  numeral: PIXEL_TYPE_SCALE.statLarge,
} as const;
