import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  MapPin,
} from 'lucide-react';
import {
  HomeAppLogoIcon,
  Book2Icon,
  WalletIcon,
  ShoppingCartIcon,
  ListAltCheckIcon,
  LaundryIcon,
} from '../components/icons/MaterialSymbols';
import {
  COLOR_FAMILIES,
  ColorFamily,
  ColorFamilyId,
  DEFAULT_INTERFACE_COLORS,
} from './colorFamilies';

export type CustomizableInterfaceId =
  | 'home'
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
    icon: HomeAppLogoIcon,
    defaultFamily: 'azure',
  },
  {
    id: 'study',
    label: 'Study',
    description: 'Focus timer, study subjects, notes, and streak tracking',
    route: '/study',
    icon: Book2Icon,
    defaultFamily: 'cyan',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Weekly class schedule, lecture rooms, and slot reminders',
    route: '/timetable',
    icon: CalendarDays,
    defaultFamily: 'indigo',
  },
  {
    id: 'spending',
    label: 'Spending',
    description: 'Daily cashflow, budget categorization, and expense analysis',
    route: '/spending',
    icon: WalletIcon,
    defaultFamily: 'emerald',
  },
  {
    id: 'shopping',
    label: 'Shopping Lists',
    description: 'Multi-category grocery, pantry inventory, and supplies checklists',
    route: '/shopping',
    icon: ShoppingCartIcon,
    defaultFamily: 'teal',
  },
  {
    id: 'outings',
    label: 'Outing Expenses',
    description: 'Shared trip budgets, group bills, receipts, and split balances',
    route: '/outings',
    icon: MapPin,
    defaultFamily: 'tangerine',
  },
  {
    id: 'tasks',
    label: 'To-Do Tasks',
    description: 'Prioritized task cards, subtasks, deadlines, and time blocks',
    route: '/tasks',
    icon: ListAltCheckIcon,
    defaultFamily: 'violet',
  },
  {
    id: 'laundry',
    label: 'Laundry',
    description: 'Washing batch cycles, garment counts, and vendor pickups',
    route: '/laundry',
    icon: LaundryIcon,
    defaultFamily: 'amber',
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
    defaultFamily: 'coral',
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
 * Reads persisted interface color assignments from localStorage or settings.
 */
export function getPersistedInterfaceColors(
  settingsInterfaceColors?: Record<string, string>
): Record<string, ColorFamilyId> {
  const assignments: Record<string, ColorFamilyId> = { ...DEFAULT_INTERFACE_COLORS };

  // 1. Try settings from AppData (cloud / synced state)
  if (settingsInterfaceColors && typeof settingsInterfaceColors === 'object') {
    for (const [key, colorId] of Object.entries(settingsInterfaceColors)) {
      if (colorId && colorId in COLOR_FAMILIES) {
        assignments[key] = colorId as ColorFamilyId;
      }
    }
  }

  // 2. Try localStorage backup (ensures instant offline sync before network loads)
  try {
    const raw = localStorage.getItem(INTERFACE_COLORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [key, colorId] of Object.entries(parsed)) {
          if (colorId && typeof colorId === 'string' && colorId in COLOR_FAMILIES) {
            assignments[key] = colorId as ColorFamilyId;
          }
        }
      }
    }
  } catch {}

  return assignments;
}

/**
 * Persists interface color assignments to localStorage.
 */
export function saveInterfaceColorsToStorage(
  assignments: Record<string, ColorFamilyId>
): void {
  try {
    localStorage.setItem(INTERFACE_COLORS_STORAGE_KEY, JSON.stringify(assignments));
    // Trigger custom event so any active hook/provider updates immediately
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
export function getCustomizableInterfaceFromPathname(pathname: string): CustomizableInterfaceId {
  const p = (pathname || '/').toLowerCase();
  if (p === '/' || p === '') return 'home';
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

  return 'home';
}
