/**
 * LifeOS — 10 Curated Tonal Color Families
 * 
 * Every family is a complete tonal system rather than a single hex color.
 * Designed for soft pastel surfaces, strong controlled accents, high readability,
 * and strict WCAG AA contrast compliance.
 */

export type ColorFamilyId =
  | 'azure'
  | 'violet'
  | 'emerald'
  | 'coral'
  | 'amber'
  | 'cyan'
  | 'indigo'
  | 'rose'
  | 'teal'
  | 'tangerine'
  | 'slate'
  | 'ruby';

export interface ColorFamily {
  id: ColorFamilyId;
  name: string;
  mood: string;
  dotColor: string;

  // Key accent & identity
  primary: string;
  accent: string;

  // Surfaces & containers
  surface: string;
  surfaceSoft: string;
  border: string;

  // Icons & graphics
  icon: string;
  iconSurface: string;

  // Typography & content
  text: string;
  textSecondary: string;

  // Interactive states & elevation
  hover: string;
  pressed: string;
  selected: string;
  focusRing: string;
  shadow: string;

  // Dark mode specialized tones
  dark: {
    primary: string;
    accent: string;
    surface: string;
    surfaceSoft: string;
    border: string;
    icon: string;
    iconSurface: string;
    text: string;
    textSecondary: string;
    hover: string;
    pressed: string;
    shadow: string;
  };
}

export const COLOR_FAMILIES: Record<ColorFamilyId, ColorFamily> = {
  // 01 — Azure: Clean / Calm / Intelligent
  azure: {
    id: 'azure',
    name: 'Azure',
    mood: 'Clean / Calm / Intelligent',
    dotColor: '#2563EB',
    primary: '#2563EB',
    accent: '#3B82F6',
    surface: '#FFFFFF',
    surfaceSoft: '#DBEAFE',
    border: '#93C5FD',
    icon: '#1D4ED8',
    iconSurface: '#BFDBFE',
    text: '#172033',
    textSecondary: '#526071',
    hover: '#EFF6FF',
    pressed: '#1D4ED8',
    selected: '#DBEAFE',
    focusRing: 'rgba(37, 99, 235, 0.45)',
    shadow: 'rgba(37, 99, 235, 0.16)',
    dark: {
      primary: '#3B82F6',
      accent: '#60A5FA',
      surface: '#161E2E',
      surfaceSoft: '#1E293B',
      border: 'rgba(147, 197, 253, 0.25)',
      icon: '#93C5FD',
      iconSurface: 'rgba(59, 130, 246, 0.2)',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      hover: 'rgba(59, 130, 246, 0.12)',
      pressed: '#2563EB',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 02 — Violet: Creative / Premium / Modern
  violet: {
    id: 'violet',
    name: 'Violet',
    mood: 'Creative / Premium / Modern',
    dotColor: '#7C3AED',
    primary: '#7C3AED',
    accent: '#8B5CF6',
    surface: '#FFFFFF',
    surfaceSoft: '#EDE9FE',
    border: '#C4B5FD',
    icon: '#6D28D9',
    iconSurface: '#DDD6FE',
    text: '#211A35',
    textSecondary: '#625A70',
    hover: '#F5F3FF',
    pressed: '#6D28D9',
    selected: '#EDE9FE',
    focusRing: 'rgba(124, 58, 237, 0.45)',
    shadow: 'rgba(124, 58, 237, 0.16)',
    dark: {
      primary: '#8B5CF6',
      accent: '#A78BFA',
      surface: '#1F1B2E',
      surfaceSoft: '#2E2644',
      border: 'rgba(196, 181, 253, 0.25)',
      icon: '#C4B5FD',
      iconSurface: 'rgba(139, 92, 246, 0.2)',
      text: '#F5F3FF',
      textSecondary: '#A78BFA',
      hover: 'rgba(139, 92, 246, 0.12)',
      pressed: '#7C3AED',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 03 — Emerald: Fresh / Healthy / Balanced
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    mood: 'Fresh / Healthy / Balanced',
    dotColor: '#059669',
    primary: '#059669',
    accent: '#10B981',
    surface: '#FFFFFF',
    surfaceSoft: '#D1FAE5',
    border: '#6EE7B7',
    icon: '#047857',
    iconSurface: '#A7F3D0',
    text: '#153027',
    textSecondary: '#52665D',
    hover: '#ECFDF5',
    pressed: '#047857',
    selected: '#D1FAE5',
    focusRing: 'rgba(5, 150, 105, 0.45)',
    shadow: 'rgba(5, 150, 105, 0.16)',
    dark: {
      primary: '#10B981',
      accent: '#34D399',
      surface: '#13231E',
      surfaceSoft: '#18382E',
      border: 'rgba(110, 231, 183, 0.25)',
      icon: '#6EE7B7',
      iconSurface: 'rgba(16, 185, 129, 0.2)',
      text: '#ECFDF5',
      textSecondary: '#6EE7B7',
      hover: 'rgba(16, 185, 129, 0.12)',
      pressed: '#059669',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 04 — Coral: Energetic / Friendly / Expressive
  coral: {
    id: 'coral',
    name: 'Coral',
    mood: 'Energetic / Friendly / Expressive',
    dotColor: '#F43F5E',
    primary: '#F43F5E',
    accent: '#FB7185',
    surface: '#FFFFFF',
    surfaceSoft: '#FFE4E6',
    border: '#FDA4AF',
    icon: '#E11D48',
    iconSurface: '#FECDD3',
    text: '#35171E',
    textSecondary: '#70535A',
    hover: '#FFF1F2',
    pressed: '#E11D48',
    selected: '#FFE4E6',
    focusRing: 'rgba(244, 63, 94, 0.45)',
    shadow: 'rgba(244, 63, 94, 0.16)',
    dark: {
      primary: '#FB7185',
      accent: '#FDA4AF',
      surface: '#29181C',
      surfaceSoft: '#3D1E25',
      border: 'rgba(253, 164, 175, 0.25)',
      icon: '#FDA4AF',
      iconSurface: 'rgba(251, 113, 133, 0.2)',
      text: '#FFF1F2',
      textSecondary: '#FDA4AF',
      hover: 'rgba(251, 113, 133, 0.12)',
      pressed: '#F43F5E',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 05 — Amber: Warm / Positive / Active
  amber: {
    id: 'amber',
    name: 'Amber',
    mood: 'Warm / Positive / Active',
    dotColor: '#F59E0B',
    primary: '#F59E0B',
    accent: '#FBBF24',
    surface: '#FFFFFF',
    surfaceSoft: '#FEF3C7',
    border: '#FCD34D',
    icon: '#D97706',
    iconSurface: '#FDE68A',
    text: '#34230A',
    textSecondary: '#6B5A35',
    hover: '#FFFBEB',
    pressed: '#D97706',
    selected: '#FEF3C7',
    focusRing: 'rgba(245, 158, 11, 0.45)',
    shadow: 'rgba(245, 158, 11, 0.16)',
    dark: {
      primary: '#FBBF24',
      accent: '#FCD34D',
      surface: '#2B2213',
      surfaceSoft: '#3E3017',
      border: 'rgba(252, 211, 77, 0.25)',
      icon: '#FCD34D',
      iconSurface: 'rgba(251, 191, 36, 0.2)',
      text: '#FFFBEB',
      textSecondary: '#FCD34D',
      hover: 'rgba(251, 191, 36, 0.12)',
      pressed: '#F59E0B',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 06 — Cyan: Technical / Fresh / Futuristic
  cyan: {
    id: 'cyan',
    name: 'Cyan',
    mood: 'Technical / Fresh / Futuristic',
    dotColor: '#0891B2',
    primary: '#0891B2',
    accent: '#06B6D4',
    surface: '#FFFFFF',
    surfaceSoft: '#CFFAFE',
    border: '#67E8F9',
    icon: '#0E7490',
    iconSurface: '#A5F3FC',
    text: '#123038',
    textSecondary: '#526A70',
    hover: '#ECFEFF',
    pressed: '#0E7490',
    selected: '#CFFAFE',
    focusRing: 'rgba(8, 145, 178, 0.45)',
    shadow: 'rgba(8, 145, 178, 0.16)',
    dark: {
      primary: '#06B6D4',
      accent: '#22D3EE',
      surface: '#122329',
      surfaceSoft: '#163640',
      border: 'rgba(103, 232, 249, 0.25)',
      icon: '#67E8F9',
      iconSurface: 'rgba(6, 182, 212, 0.2)',
      text: '#ECFEFF',
      textSecondary: '#67E8F9',
      hover: 'rgba(6, 182, 212, 0.12)',
      pressed: '#0891B2',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 07 — Indigo: Focused / Professional / Deep
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    mood: 'Focused / Professional / Deep',
    dotColor: '#4F46E5',
    primary: '#4F46E5',
    accent: '#6366F1',
    surface: '#FFFFFF',
    surfaceSoft: '#E0E7FF',
    border: '#A5B4FC',
    icon: '#4338CA',
    iconSurface: '#C7D2FE',
    text: '#1E2040',
    textSecondary: '#575A78',
    hover: '#EEF2FF',
    pressed: '#4338CA',
    selected: '#E0E7FF',
    focusRing: 'rgba(79, 70, 229, 0.45)',
    shadow: 'rgba(79, 70, 229, 0.16)',
    dark: {
      primary: '#6366F1',
      accent: '#818CF8',
      surface: '#1A1B30',
      surfaceSoft: '#25274A',
      border: 'rgba(165, 180, 252, 0.25)',
      icon: '#A5B4FC',
      iconSurface: 'rgba(99, 102, 241, 0.2)',
      text: '#EEF2FF',
      textSecondary: '#A5B4FC',
      hover: 'rgba(99, 102, 241, 0.12)',
      pressed: '#4F46E5',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 08 — Rose: Soft / Elegant / Expressive
  rose: {
    id: 'rose',
    name: 'Rose',
    mood: 'Soft / Elegant / Expressive',
    dotColor: '#DB2777',
    primary: '#DB2777',
    accent: '#EC4899',
    surface: '#FFFFFF',
    surfaceSoft: '#FCE7F3',
    border: '#F9A8D4',
    icon: '#BE185D',
    iconSurface: '#FBCFE8',
    text: '#351526',
    textSecondary: '#705466',
    hover: '#FDF2F8',
    pressed: '#BE185D',
    selected: '#FCE7F3',
    focusRing: 'rgba(219, 39, 119, 0.45)',
    shadow: 'rgba(219, 39, 119, 0.16)',
    dark: {
      primary: '#EC4899',
      accent: '#F472B6',
      surface: '#2B1622',
      surfaceSoft: '#421E33',
      border: 'rgba(249, 168, 212, 0.25)',
      icon: '#F9A8D4',
      iconSurface: 'rgba(236, 72, 153, 0.2)',
      text: '#FDF2F8',
      textSecondary: '#F9A8D4',
      hover: 'rgba(236, 72, 153, 0.12)',
      pressed: '#DB2777',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 09 — Teal: Minimal / Sophisticated / Calm
  teal: {
    id: 'teal',
    name: 'Teal',
    mood: 'Minimal / Sophisticated / Calm',
    dotColor: '#0F766E',
    primary: '#0F766E',
    accent: '#14B8A6',
    surface: '#FFFFFF',
    surfaceSoft: '#CCFBF1',
    border: '#5EEAD4',
    icon: '#115E59',
    iconSurface: '#99F6E4',
    text: '#153332',
    textSecondary: '#526A68',
    hover: '#F0FDFA',
    pressed: '#115E59',
    selected: '#CCFBF1',
    focusRing: 'rgba(15, 118, 110, 0.45)',
    shadow: 'rgba(15, 118, 110, 0.16)',
    dark: {
      primary: '#14B8A6',
      accent: '#2DD4BF',
      surface: '#112524',
      surfaceSoft: '#163B39',
      border: 'rgba(94, 234, 212, 0.25)',
      icon: '#5EEAD4',
      iconSurface: 'rgba(20, 184, 166, 0.2)',
      text: '#F0FDFA',
      textSecondary: '#5EEAD4',
      hover: 'rgba(20, 184, 166, 0.12)',
      pressed: '#0F766E',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 10 — Tangerine: Bold / Playful / Warm
  tangerine: {
    id: 'tangerine',
    name: 'Tangerine',
    mood: 'Bold / Playful / Warm',
    dotColor: '#EA580C',
    primary: '#EA580C',
    accent: '#F97316',
    surface: '#FFFFFF',
    surfaceSoft: '#FFEDD5',
    border: '#FDBA74',
    icon: '#C2410C',
    iconSurface: '#FED7AA',
    text: '#352016',
    textSecondary: '#70584B',
    hover: '#FFF7ED',
    pressed: '#C2410C',
    selected: '#FFEDD5',
    focusRing: 'rgba(234, 88, 12, 0.45)',
    shadow: 'rgba(234, 88, 12, 0.16)',
    dark: {
      primary: '#F97316',
      accent: '#FB923C',
      surface: '#2B1B14',
      surfaceSoft: '#42281D',
      border: 'rgba(253, 186, 116, 0.25)',
      icon: '#FDBA74',
      iconSurface: 'rgba(249, 115, 22, 0.2)',
      text: '#FFF7ED',
      textSecondary: '#FDBA74',
      hover: 'rgba(249, 115, 22, 0.12)',
      pressed: '#EA580C',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 11 — Slate: Sleek / Minimalist / Titanium
  slate: {
    id: 'slate',
    name: 'Slate',
    mood: 'Sleek, minimalist, and balanced system aesthetics',
    dotColor: '#64748B',
    primary: '#475569',
    accent: '#334155',
    surface: '#FFFFFF',
    surfaceSoft: '#F1F5F9',
    border: '#CBD5E1',
    icon: '#475569',
    iconSurface: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    hover: '#F8FAFC',
    pressed: '#334155',
    selected: '#F1F5F9',
    focusRing: 'rgba(71, 85, 105, 0.35)',
    shadow: 'rgba(71, 85, 105, 0.12)',
    dark: {
      primary: '#94A3B8',
      accent: '#CBD5E1',
      surface: '#1E293B',
      surfaceSoft: '#0F172A',
      border: 'rgba(148, 163, 184, 0.2)',
      icon: '#94A3B8',
      iconSurface: 'rgba(148, 163, 184, 0.15)',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      hover: 'rgba(148, 163, 184, 0.1)',
      pressed: '#334155',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 12 — Ruby: Passion / Bold / Distinct
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    mood: 'Deep crimson vitality and striking identity',
    dotColor: '#E11D48',
    primary: '#BE123C',
    accent: '#9F1239',
    surface: '#FFFFFF',
    surfaceSoft: '#FFF1F2',
    border: '#FECDD3',
    icon: '#BE123C',
    iconSurface: '#FFE4E6',
    text: '#172033',
    textSecondary: '#881337',
    hover: '#FFF5F6',
    pressed: '#881337',
    selected: '#FFF1F2',
    focusRing: 'rgba(190, 18, 60, 0.35)',
    shadow: 'rgba(190, 18, 60, 0.15)',
    dark: {
      primary: '#FB7185',
      accent: '#FDA4AF',
      surface: '#271118',
      surfaceSoft: '#1A0B10',
      border: 'rgba(251, 113, 133, 0.22)',
      icon: '#FB7185',
      iconSurface: 'rgba(251, 113, 133, 0.16)',
      text: '#FFF1F2',
      textSecondary: '#FECDD3',
      hover: 'rgba(251, 113, 133, 0.1)',
      pressed: '#BE123C',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },
};

export const COLOR_FAMILY_LIST = Object.values(COLOR_FAMILIES);

/**
 * Returns a high-contrast foreground color (#FFFFFF or dark neutral #172033)
 * based on the WCAG relative luminance of the background color.
 */
export function getReadableForeground(bgHex: string): '#FFFFFF' | '#172033' {
  const clean = bgHex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Return dark neutral if background is bright (lum > 0.4), otherwise white
  return lum > 0.4 ? '#172033' : '#FFFFFF';
}

/**
 * Default color assignments preserving LifeOS's authentic visual identity.
 * 1-to-1 mapping across interfaces with zero color duplication.
 */
export const DEFAULT_INTERFACE_COLORS: Record<string, ColorFamilyId> = {
  home: 'azure',       // Royal Blue identity
  study: 'cyan',       // Lagoon Cyan identity
  timetable: 'indigo', // Academic / Focused Indigo identity
  spending: 'emerald', // Fresh Green Wealth identity
  shopping: 'teal',    // Clean Sophisticated Teal identity
  outings: 'tangerine', // Bold Outing Warmth identity
  tasks: 'violet',     // Expressive Modern Violet identity
  laundry: 'amber',    // Warm Positive Active identity
  history: 'rose',     // Burgundy / Rose identity
  vault: 'coral',      // Security Accent Coral identity
  settings: 'slate',   // Sleek Titanium Slate identity
};
