import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  BookOpen,
  CalendarDays,
  Wallet,
  ShoppingCart,
  MapPin,
  CheckSquare,
  Shirt,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
} from 'lucide-react';
import type {
  ColorFamily,
  ColorFamilyId,
} from './colorFamilies.ts';
import {
  COLOR_FAMILIES,
  DEFAULT_INTERFACE_COLORS,
} from './colorFamilies.ts';

export type CustomizableInterfaceId =
  | 'home'
  | 'gym'
  | 'nutrition'
  | 'study'
  | 'timetable'
  | 'spending'
  | 'shopping'
  | 'outings'
  | 'tasks'
  | 'laundry'
  | 'history'
  | 'vault'
  | 'settings';

export interface InterfaceConfig {
  id: CustomizableInterfaceId;
  label: string;
  description: string;
  route: string;
  icon: LucideIcon;
  defaultFamily: ColorFamilyId;
}

export const CUSTOMIZABLE_INTERFACES: InterfaceConfig[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Dashboard, day phase overview, and quick status',
    route: '/',
    icon: Home,
    defaultFamily: 'azure',
  },
  {
    id: 'gym',
    label: 'Gym',
    description: 'Workout routines, exercise logs, and split schedules',
    route: '/gym',
    icon: Dumbbell,
    defaultFamily: 'coral',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    description: 'Daily meals, mess schedule, night canteen, and calories',
    route: '/nutrition',
    icon: UtensilsCrossed,
    defaultFamily: 'amber',
  },
  {
    id: 'study',
    label: 'Study',
    description: 'Focus timer, study subjects, notes, and streak tracking',
    route: '/study',
    icon: BookOpen,
    defaultFamily: 'cyan',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Weekly class schedule, lecture rooms, and slot reminders',
    route: '/timetable',
    icon: CalendarDays,
    defaultFamily: 'cyan',
  },
  {
    id: 'spending',
    label: 'Spending',
    description: 'Daily cashflow, budget categorization, and expense analysis',
    route: '/spending',
    icon: Wallet,
    defaultFamily: 'emerald',
  },
  {
    id: 'shopping',
    label: 'Shopping Lists',
    description: 'Multi-category grocery, pantry inventory, and supplies checklists',
    route: '/shopping',
    icon: ShoppingCart,
    defaultFamily: 'charcoal',
  },
  {
    id: 'outings',
    label: 'Outing Expenses',
    description: 'Shared trip budgets, group bills, receipts, and split balances',
    route: '/outings',
    icon: MapPin,
    defaultFamily: 'copper',
  },
  {
    id: 'tasks',
    label: 'To-Do Tasks',
    description: 'Prioritized task cards, subtasks, deadlines, and time blocks',
    route: '/tasks',
    icon: CheckSquare,
    defaultFamily: 'violet',
  },
  {
    id: 'laundry',
    label: 'Laundry',
    description: 'Washing batch cycles, garment counts, and vendor pickups',
    route: '/laundry',
    icon: Shirt,
    defaultFamily: 'teal',
  },
  {
    id: 'history',
    label: 'History',
    description: 'Long-term analytics, milestone records, and performance review',
    route: '/history',
    icon: HistoryIcon,
    defaultFamily: 'rose',
  },
  {
    id: 'vault',
    label: 'Vault',
    description: 'Encrypted credentials, confidential notes, and biometric lock',
    route: '/vault',
    icon: ShieldCheck,
    defaultFamily: 'cobalt',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'System preferences, biometrics, offline sync, and personalization',
    route: '/settings',
    icon: SettingsIcon,
    defaultFamily: 'slate',
  },
];

export const INTERFACE_MAP = new Map<CustomizableInterfaceId, InterfaceConfig>(
  CUSTOMIZABLE_INTERFACES.map((cfg) => [cfg.id, cfg])
);

/**
 * Storage key for localStorage backup of interface color assignments
 */
export const INTERFACE_COLORS_STORAGE_KEY = 'lifeos_interface_colors';

/**
 * Reads raw user customizations (returns null if user has NOT customized colors)
 */
export function getRawUserCustomColors(
  settingsInterfaceColors?: Record<string, string>
): Record<string, ColorFamilyId> | null {
  if (settingsInterfaceColors && typeof settingsInterfaceColors === 'object' && Object.keys(settingsInterfaceColors).length > 0) {
    const valid: Record<string, ColorFamilyId> = {};
    for (const [k, v] of Object.entries(settingsInterfaceColors)) {
      if (v && v in COLOR_FAMILIES) {
        valid[k] = v as ColorFamilyId;
      }
    }
    if (Object.keys(valid).length > 0) return valid;
  }

  try {
    const raw = localStorage.getItem(INTERFACE_COLORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        const valid: Record<string, ColorFamilyId> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'string' && v in COLOR_FAMILIES) {
            valid[k] = v as ColorFamilyId;
          }
        }
        if (Object.keys(valid).length > 0) return valid;
      }
    }
  } catch {}

  return null;
}

/**
 * Reads interface color assignments for Settings UI display.
 * Merges factory defaults with any explicit user custom overrides.
 */
export function getPersistedInterfaceColors(
  settingsInterfaceColors?: Record<string, string>
): Record<string, ColorFamilyId> {
  const defaults: Record<string, ColorFamilyId> = { ...DEFAULT_INTERFACE_COLORS };
  const custom = getRawUserCustomColors(settingsInterfaceColors);
  if (custom) {
    return { ...defaults, ...custom };
  }
  return defaults;
}

/**
 * Persists interface color assignments to localStorage.
 */
export function saveInterfaceColorsToStorage(
  assignments: Record<string, ColorFamilyId>
): void {
  try {
    localStorage.setItem(INTERFACE_COLORS_STORAGE_KEY, JSON.stringify(assignments));
    window.dispatchEvent(new CustomEvent('lifeos:interface-colors-changed', { detail: assignments }));
  } catch {}
}

/**
 * Strict 1-to-1 Duplicate Prevention Check:
 * A color family can only belong to one interface at a time.
 */
export function isColorAvailable(
  colorId: string,
  targetInterface: CustomizableInterfaceId,
  currentAssignments: Record<string, string>
): boolean {
  return !Object.entries(currentAssignments).some(
    ([ifaceId, assignedColor]) =>
      ifaceId !== targetInterface && assignedColor === colorId
  );
}

/**
 * Returns which interface currently owns the specified color family, if any.
 */
export function getOwnerInterface(
  colorId: string,
  currentAssignments: Record<string, string>
): InterfaceConfig | null {
  for (const [ifaceId, assignedColor] of Object.entries(currentAssignments)) {
    if (assignedColor === colorId) {
      return INTERFACE_MAP.get(ifaceId as CustomizableInterfaceId) || null;
    }
  }
  return null;
}

/**
 * Resolves the full tonal ColorFamily object for a given interface.
 */
export function getInterfaceColorFamily(
  interfaceId: string,
  currentAssignments?: Record<string, string>
): ColorFamily {
  const familyId =
    (currentAssignments && (currentAssignments[interfaceId] as ColorFamilyId)) ||
    DEFAULT_INTERFACE_COLORS[interfaceId] ||
    'azure';

  return COLOR_FAMILIES[familyId] || COLOR_FAMILIES.azure;
}

/**
 * Maps a URL route pathname to its canonical CustomizableInterfaceId.
 */
export function getCustomizableInterfaceFromPathname(pathname: string): CustomizableInterfaceId | null {
  const p = (pathname || '/').toLowerCase();
  if (p === '/' || p === '') return 'home';
  if (p.startsWith('/gym')) return 'gym';
  if (p.startsWith('/nutrition')) return 'nutrition';
  if (p.startsWith('/timetable')) return 'timetable';
  if (p.startsWith('/study')) return 'study';
  if (p.startsWith('/spending')) return 'spending';
  if (p.startsWith('/shopping')) return 'shopping';
  if (p.startsWith('/outings')) return 'outings';
  if (p.startsWith('/tasks')) return 'tasks';
  if (p.startsWith('/laundry')) return 'laundry';
  if (p.startsWith('/history')) return 'history';
  if (p.startsWith('/vault')) return 'vault';
  if (p.startsWith('/settings')) return 'settings';

  return null;
}
