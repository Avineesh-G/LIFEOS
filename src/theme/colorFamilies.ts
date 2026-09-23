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
  | 'ruby'
  | 'mint'
  | 'lavender'
  | 'crimson'
  | 'cobalt'
  | 'peach'
  | 'lime'
  | 'plum'
  | 'gold'
  | 'sky'
  | 'sage'
  | 'fuchsia'
  | 'copper'
  | 'charcoal';

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

  // 03 — Emerald: Fresh / Healthy / Balanced (Finance & Spending Authentic)
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    mood: 'Fresh / Healthy / Balanced',
    dotColor: '#15803D',
    primary: '#15803D',
    accent: '#16A34A',
    surface: '#FFFFFF',
    surfaceSoft: '#E8F5E9',
    border: '#A7F3D0',
    icon: '#15803D',
    iconSurface: '#DCFCE7',
    text: '#122E1A',
    textSecondary: '#15803D',
    hover: '#ECFDF5',
    pressed: '#14532D',
    selected: '#E8F5E9',
    focusRing: 'rgba(21, 128, 61, 0.45)',
    shadow: 'rgba(21, 128, 61, 0.16)',
    dark: {
      primary: '#15803D',
      accent: '#82CB92',
      surface: '#122E1A',
      surfaceSoft: '#16351F',
      border: 'rgba(130, 203, 146, 0.25)',
      icon: '#82CB92',
      iconSurface: 'rgba(21, 128, 61, 0.25)',
      text: '#ECFDF5',
      textSecondary: '#82CB92',
      hover: 'rgba(21, 128, 61, 0.12)',
      pressed: '#15803D',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 04 — Coral: Energetic / Friendly / Expressive (Gym & Workouts Authentic)
  coral: {
    id: 'coral',
    name: 'Coral',
    mood: 'Energetic / Friendly / Expressive',
    dotColor: '#E11D48',
    primary: '#E11D48',
    accent: '#FB7185',
    surface: '#FFFFFF',
    surfaceSoft: '#FBDFE5',
    border: '#FDA4AF',
    icon: '#E11D48',
    iconSurface: '#FECDD3',
    text: '#381620',
    textSecondary: '#E11D48',
    hover: '#FFF1F2',
    pressed: '#BE123C',
    selected: '#FBDFE5',
    focusRing: 'rgba(225, 29, 72, 0.45)',
    shadow: 'rgba(225, 29, 72, 0.16)',
    dark: {
      primary: '#E11D48',
      accent: '#FB7185',
      surface: '#381620',
      surfaceSoft: '#29181C',
      border: 'rgba(253, 164, 175, 0.25)',
      icon: '#FB7185',
      iconSurface: 'rgba(225, 29, 72, 0.2)',
      text: '#FFF1F2',
      textSecondary: '#FB7185',
      hover: 'rgba(225, 29, 72, 0.12)',
      pressed: '#BE123C',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 05 — Amber: Warm / Positive / Active (Nutrition & Mess Authentic)
  amber: {
    id: 'amber',
    name: 'Amber',
    mood: 'Warm / Positive / Active',
    dotColor: '#F5A623',
    primary: '#F5A623',
    accent: '#FBC15E',
    surface: '#FFFFFF',
    surfaceSoft: '#FEF3E0',
    border: '#FDE68A',
    icon: '#D97706',
    iconSurface: '#FEF3C7',
    text: '#3A2A14',
    textSecondary: '#9F6803',
    hover: '#FFFBEB',
    pressed: '#D97706',
    selected: '#FEF3E0',
    focusRing: 'rgba(245, 166, 35, 0.45)',
    shadow: 'rgba(245, 166, 35, 0.16)',
    dark: {
      primary: '#F5A623',
      accent: '#FBC15E',
      surface: '#3A2A14',
      surfaceSoft: '#2B1E0D',
      border: 'rgba(251, 193, 94, 0.25)',
      icon: '#FBC15E',
      iconSurface: 'rgba(245, 166, 35, 0.2)',
      text: '#FEF3E0',
      textSecondary: '#FBC15E',
      hover: 'rgba(245, 166, 35, 0.12)',
      pressed: '#D97706',
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

  // 13 — Mint: Crisp / Fresh / Nordic
  mint: {
    id: 'mint',
    name: 'Mint',
    mood: 'Crisp, refreshing botanical clarity and balance',
    dotColor: '#10B981',
    primary: '#059669',
    accent: '#047857',
    surface: '#FFFFFF',
    surfaceSoft: '#ECFDF5',
    border: '#A7F3D0',
    icon: '#059669',
    iconSurface: '#D1FAE5',
    text: '#064E3B',
    textSecondary: '#047857',
    hover: '#F0FDF4',
    pressed: '#047857',
    selected: '#ECFDF5',
    focusRing: 'rgba(5, 150, 105, 0.35)',
    shadow: 'rgba(5, 150, 105, 0.15)',
    dark: {
      primary: '#34D399',
      accent: '#6EE7B7',
      surface: '#0F241C',
      surfaceSoft: '#061812',
      border: 'rgba(52, 211, 153, 0.22)',
      icon: '#34D399',
      iconSurface: 'rgba(52, 211, 153, 0.16)',
      text: '#ECFDF5',
      textSecondary: '#A7F3D0',
      hover: 'rgba(52, 211, 153, 0.1)',
      pressed: '#059669',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 14 — Lavender: Electric / Creative / Serene
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    mood: 'Soft electric lilac warmth and contemplative ease',
    dotColor: '#8B5CF6',
    primary: '#7C3AED',
    accent: '#6D28D9',
    surface: '#FFFFFF',
    surfaceSoft: '#F5F3FF',
    border: '#DDD6FE',
    icon: '#7C3AED',
    iconSurface: '#EDE9FE',
    text: '#2E1065',
    textSecondary: '#6D28D9',
    hover: '#FAF5FF',
    pressed: '#5B21B6',
    selected: '#F5F3FF',
    focusRing: 'rgba(124, 58, 237, 0.35)',
    shadow: 'rgba(124, 58, 237, 0.15)',
    dark: {
      primary: '#A78BFA',
      accent: '#C4B5FD',
      surface: '#1D1433',
      surfaceSoft: '#130C24',
      border: 'rgba(167, 139, 250, 0.22)',
      icon: '#A78BFA',
      iconSurface: 'rgba(167, 139, 250, 0.16)',
      text: '#F5F3FF',
      textSecondary: '#DDD6FE',
      hover: 'rgba(167, 139, 250, 0.1)',
      pressed: '#7C3AED',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 15 — Crimson: Velvet / Bold / Imperial
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    mood: 'Intense velvet determination and focused authority',
    dotColor: '#DC2626',
    primary: '#B91C1C',
    accent: '#991B1B',
    surface: '#FFFFFF',
    surfaceSoft: '#FEF2F2',
    border: '#FECACA',
    icon: '#B91C1C',
    iconSurface: '#FEE2E2',
    text: '#450A0A',
    textSecondary: '#991B1B',
    hover: '#FFF5F5',
    pressed: '#7F1D1D',
    selected: '#FEF2F2',
    focusRing: 'rgba(185, 28, 28, 0.35)',
    shadow: 'rgba(185, 28, 28, 0.15)',
    dark: {
      primary: '#F87171',
      accent: '#FCA5A5',
      surface: '#281113',
      surfaceSoft: '#1A090B',
      border: 'rgba(248, 113, 113, 0.22)',
      icon: '#F87171',
      iconSurface: 'rgba(248, 113, 113, 0.16)',
      text: '#FEF2F2',
      textSecondary: '#FECACA',
      hover: 'rgba(248, 113, 113, 0.1)',
      pressed: '#B91C1C',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 16 — Cobalt: Ultramarine / Deep / High-Precision
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt',
    mood: 'Deep ultramarine depth and high-precision focus',
    dotColor: '#1D4ED8',
    primary: '#1E40AF',
    accent: '#1E3A8A',
    surface: '#FFFFFF',
    surfaceSoft: '#EFF6FF',
    border: '#BFDBFE',
    icon: '#1E40AF',
    iconSurface: '#DBEAFE',
    text: '#172554',
    textSecondary: '#1E40AF',
    hover: '#F8FAFC',
    pressed: '#172554',
    selected: '#EFF6FF',
    focusRing: 'rgba(30, 64, 175, 0.35)',
    shadow: 'rgba(30, 64, 175, 0.15)',
    dark: {
      primary: '#60A5FA',
      accent: '#93C5FD',
      surface: '#111E38',
      surfaceSoft: '#0A1326',
      border: 'rgba(96, 165, 250, 0.22)',
      icon: '#60A5FA',
      iconSurface: 'rgba(96, 165, 250, 0.16)',
      text: '#EFF6FF',
      textSecondary: '#BFDBFE',
      hover: 'rgba(96, 165, 250, 0.1)',
      pressed: '#1E40AF',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 17 — Peach: Sunset / Warm / Gentle
  peach: {
    id: 'peach',
    name: 'Peach',
    mood: 'Gentle golden hour sunset glow and warmth',
    dotColor: '#FB923C',
    primary: '#EA580C',
    accent: '#C2410C',
    surface: '#FFFFFF',
    surfaceSoft: '#FFF7ED',
    border: '#FED7AA',
    icon: '#EA580C',
    iconSurface: '#FFEDD5',
    text: '#431407',
    textSecondary: '#9A3412',
    hover: '#FFFDFB',
    pressed: '#9A3412',
    selected: '#FFF7ED',
    focusRing: 'rgba(234, 88, 12, 0.35)',
    shadow: 'rgba(234, 88, 12, 0.15)',
    dark: {
      primary: '#FB923C',
      accent: '#FDBA74',
      surface: '#2B170E',
      surfaceSoft: '#1C0D07',
      border: 'rgba(251, 146, 60, 0.22)',
      icon: '#FB923C',
      iconSurface: 'rgba(251, 146, 60, 0.16)',
      text: '#FFF7ED',
      textSecondary: '#FED7AA',
      hover: 'rgba(251, 146, 60, 0.1)',
      pressed: '#EA580C',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 18 — Lime: Botanical / Dynamic / Alive
  lime: {
    id: 'lime',
    name: 'Lime',
    mood: 'Dynamic botanical energy and lively optimism',
    dotColor: '#84CC16',
    primary: '#65A30D',
    accent: '#4D7C0F',
    surface: '#FFFFFF',
    surfaceSoft: '#F7FEE7',
    border: '#D9F99D',
    icon: '#65A30D',
    iconSurface: '#ECFCCB',
    text: '#1A2E05',
    textSecondary: '#4D7C0F',
    hover: '#FAFFF0',
    pressed: '#3F6212',
    selected: '#F7FEE7',
    focusRing: 'rgba(101, 163, 13, 0.35)',
    shadow: 'rgba(101, 163, 13, 0.15)',
    dark: {
      primary: '#A3E635',
      accent: '#BEF264',
      surface: '#17230A',
      surfaceSoft: '#0D1604',
      border: 'rgba(163, 230, 53, 0.22)',
      icon: '#A3E635',
      iconSurface: 'rgba(163, 230, 53, 0.16)',
      text: '#F7FEE7',
      textSecondary: '#D9F99D',
      hover: 'rgba(163, 230, 53, 0.1)',
      pressed: '#65A30D',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 19 — Plum: Imperial / Mulberry / Rich
  plum: {
    id: 'plum',
    name: 'Plum',
    mood: 'Rich imperial mulberry depth and refined presence',
    dotColor: '#A21CAF',
    primary: '#86198F',
    accent: '#701A75',
    surface: '#FFFFFF',
    surfaceSoft: '#FDF4FF',
    border: '#F5D0FE',
    icon: '#86198F',
    iconSurface: '#FAE8FF',
    text: '#4A044E',
    textSecondary: '#701A75',
    hover: '#FCF0FE',
    pressed: '#500724',
    selected: '#FDF4FF',
    focusRing: 'rgba(134, 25, 143, 0.35)',
    shadow: 'rgba(134, 25, 143, 0.15)',
    dark: {
      primary: '#E879F9',
      accent: '#F0ABFC',
      surface: '#260E2A',
      surfaceSoft: '#17071A',
      border: 'rgba(232, 121, 249, 0.22)',
      icon: '#E879F9',
      iconSurface: 'rgba(232, 121, 249, 0.16)',
      text: '#FDF4FF',
      textSecondary: '#F5D0FE',
      hover: 'rgba(232, 121, 249, 0.1)',
      pressed: '#86198F',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 20 — Gold: Royal / Luminous / Honey
  gold: {
    id: 'gold',
    name: 'Gold',
    mood: 'Luminous royal honey warmth and celebratory shine',
    dotColor: '#EAB308',
    primary: '#CA8A04',
    accent: '#A16207',
    surface: '#FFFFFF',
    surfaceSoft: '#FEFCE8',
    border: '#FEF08A',
    icon: '#CA8A04',
    iconSurface: '#FEF9C3',
    text: '#422006',
    textSecondary: '#854D0E',
    hover: '#FFFEEF',
    pressed: '#713F12',
    selected: '#FEFCE8',
    focusRing: 'rgba(202, 138, 4, 0.35)',
    shadow: 'rgba(202, 138, 4, 0.15)',
    dark: {
      primary: '#FACC15',
      accent: '#FDE047',
      surface: '#28200B',
      surfaceSoft: '#1B1506',
      border: 'rgba(250, 204, 21, 0.22)',
      icon: '#FACC15',
      iconSurface: 'rgba(250, 204, 21, 0.16)',
      text: '#FEFCE8',
      textSecondary: '#FEF08A',
      hover: 'rgba(250, 204, 21, 0.1)',
      pressed: '#CA8A04',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 21 — Sky: Zenith / Clear / Open
  sky: {
    id: 'sky',
    name: 'Sky',
    mood: 'Zenith open horizon clarity and crisp freshness',
    dotColor: '#38BDF8',
    primary: '#0284C7',
    accent: '#0369A1',
    surface: '#FFFFFF',
    surfaceSoft: '#F0F9FF',
    border: '#BAE6FD',
    icon: '#0284C7',
    iconSurface: '#E0F2FE',
    text: '#082F49',
    textSecondary: '#0369A1',
    hover: '#F8FCFF',
    pressed: '#075985',
    selected: '#F0F9FF',
    focusRing: 'rgba(2, 132, 199, 0.35)',
    shadow: 'rgba(2, 132, 199, 0.15)',
    dark: {
      primary: '#38BDF8',
      accent: '#7DD3FC',
      surface: '#0D2235',
      surfaceSoft: '#061523',
      border: 'rgba(56, 189, 248, 0.22)',
      icon: '#38BDF8',
      iconSurface: 'rgba(56, 189, 248, 0.16)',
      text: '#F0F9FF',
      textSecondary: '#BAE6FD',
      hover: 'rgba(56, 189, 248, 0.1)',
      pressed: '#0284C7',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 22 — Sage: Botanical / Earthy / Nordic
  sage: {
    id: 'sage',
    name: 'Sage',
    mood: 'Scandinavian earthy pine sage and organic calm',
    dotColor: '#4D7C0F',
    primary: '#3F6212',
    accent: '#365314',
    surface: '#FFFFFF',
    surfaceSoft: '#F4F7F4',
    border: '#CBD5C0',
    icon: '#3F6212',
    iconSurface: '#E6ECE0',
    text: '#1C2816',
    textSecondary: '#475B3E',
    hover: '#F8FAF7',
    pressed: '#2B3E1C',
    selected: '#F0F5EC',
    focusRing: 'rgba(63, 98, 18, 0.35)',
    shadow: 'rgba(63, 98, 18, 0.14)',
    dark: {
      primary: '#8FA382',
      accent: '#AEC3A2',
      surface: '#151E14',
      surfaceSoft: '#0D140C',
      border: 'rgba(143, 163, 130, 0.22)',
      icon: '#8FA382',
      iconSurface: 'rgba(143, 163, 130, 0.16)',
      text: '#F4F7F4',
      textSecondary: '#CBD5C0',
      hover: 'rgba(143, 163, 130, 0.1)',
      pressed: '#3F6212',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 23 — Fuchsia: Neon / Radiant / Expressive
  fuchsia: {
    id: 'fuchsia',
    name: 'Fuchsia',
    mood: 'Radiant electric fuchsia and daring modern rhythm',
    dotColor: '#D946EF',
    primary: '#C026D3',
    accent: '#A21CAF',
    surface: '#FFFFFF',
    surfaceSoft: '#FDF4FF',
    border: '#F5D0FE',
    icon: '#C026D3',
    iconSurface: '#FAE8FF',
    text: '#4A044E',
    textSecondary: '#A21CAF',
    hover: '#FEF7FF',
    pressed: '#86198F',
    selected: '#FDF4FF',
    focusRing: 'rgba(192, 38, 211, 0.35)',
    shadow: 'rgba(192, 38, 211, 0.15)',
    dark: {
      primary: '#F0ABFC',
      accent: '#F472B6',
      surface: '#280E2B',
      surfaceSoft: '#18061A',
      border: 'rgba(240, 171, 252, 0.22)',
      icon: '#F0ABFC',
      iconSurface: 'rgba(240, 171, 252, 0.16)',
      text: '#FDF4FF',
      textSecondary: '#F5D0FE',
      hover: 'rgba(240, 171, 252, 0.1)',
      pressed: '#C026D3',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 24 — Copper: Burnished / Metallic / Industrial
  copper: {
    id: 'copper',
    name: 'Copper',
    mood: 'Burnished metallic copper and artisanal depth',
    dotColor: '#D97706',
    primary: '#B45309',
    accent: '#92400E',
    surface: '#FFFFFF',
    surfaceSoft: '#FFFBEB',
    border: '#FDE68A',
    icon: '#B45309',
    iconSurface: '#FEF3C7',
    text: '#451A03',
    textSecondary: '#78350F',
    hover: '#FFFCF2',
    pressed: '#78350F',
    selected: '#FFFBEB',
    focusRing: 'rgba(180, 83, 9, 0.35)',
    shadow: 'rgba(180, 83, 9, 0.15)',
    dark: {
      primary: '#FBBF24',
      accent: '#FCD34D',
      surface: '#27180D',
      surfaceSoft: '#190E07',
      border: 'rgba(251, 191, 36, 0.22)',
      icon: '#FBBF24',
      iconSurface: 'rgba(251, 191, 36, 0.16)',
      text: '#FFFBEB',
      textSecondary: '#FDE68A',
      hover: 'rgba(251, 191, 36, 0.1)',
      pressed: '#B45309',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
  },

  // 25 — Charcoal: Minimalist / Onyx / Architectural
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal',
    mood: 'Minimalist architectural onyx and clean precision',
    dotColor: '#334155',
    primary: '#1E293B',
    accent: '#0F172A',
    surface: '#FFFFFF',
    surfaceSoft: '#F8FAFC',
    border: '#CBD5E1',
    icon: '#1E293B',
    iconSurface: '#E2E8F0',
    text: '#020617',
    textSecondary: '#475569',
    hover: '#F1F5F9',
    pressed: '#0F172A',
    selected: '#F1F5F9',
    focusRing: 'rgba(30, 41, 59, 0.35)',
    shadow: 'rgba(30, 41, 59, 0.15)',
    dark: {
      primary: '#CBD5E1',
      accent: '#E2E8F0',
      surface: '#151B26',
      surfaceSoft: '#0B0F17',
      border: 'rgba(203, 213, 225, 0.2)',
      icon: '#CBD5E1',
      iconSurface: 'rgba(203, 213, 225, 0.15)',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      hover: 'rgba(203, 213, 225, 0.1)',
      pressed: '#1E293B',
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
  home: 'azure',       // Royal Blue #2563EB
  gym: 'coral',        // Coral Crimson #E11D48
  nutrition: 'amber',  // Solar Amber #F5A623
  study: 'cyan',       // Lagoon Cyan #0891B2
  timetable: 'cyan',   // Lagoon Cyan #0891B2
  spending: 'emerald', // Forest Green #15803D
  shopping: 'charcoal',// Midnight Navy #172554
  outings: 'copper',   // Saddle Brown #8C500A
  tasks: 'violet',     // Modern Violet #7C3AED
  laundry: 'teal',     // Clean Teal #0D9488
  history: 'rose',     // Burgundy / Rose #8C1D40
  vault: 'cobalt',     // Cyber Cobalt #2034A0
  settings: 'slate',   // Sleek Titanium Slate #475569
  notes: 'fuchsia',    // Electric Orchid Fuchsia #C026D3
};
