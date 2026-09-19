import {
  BookOpen,
  CalendarDays,
  Wallet,
  ShoppingBag,
  CheckSquare,
  Shirt,
  BarChart3,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  LucideIcon,
} from 'lucide-react';
import { AppSection } from '../theme/sectionSeedColors';

export type HubFamily = 'study' | 'finance' | 'home' | 'system';

export interface HubDestination {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  family: HubFamily;
}

/**
 * Static typed array of Hub Destinations (10 destinations, strictly ordered by family bands)
 * Row 1: Study, Timetable (Study) + Spending, Shopping Lists (Finance)
 * Row 2: To-Do Tasks, Laundry, Progress & Analytics, History (Home tools)
 * Row 3: Vault, Settings (System)
 */
export const HUB_DESTINATIONS: HubDestination[] = [
  // Row 1: Study family + Finance family
  { id: 'study', label: 'Study', route: '/study', icon: BookOpen, family: 'study' },
  { id: 'timetable', label: 'Timetable', route: '/timetable', icon: CalendarDays, family: 'study' },
  { id: 'spending', label: 'Spending', route: '/spending', icon: Wallet, family: 'finance' },
  { id: 'shopping', label: 'Shopping Lists', route: '/shopping', icon: ShoppingBag, family: 'finance' },

  // Row 2: Home tools family
  { id: 'tasks', label: 'To-Do Tasks', route: '/tasks', icon: CheckSquare, family: 'home' },
  { id: 'laundry', label: 'Laundry', route: '/laundry', icon: Shirt, family: 'home' },
  { id: 'progress', label: 'Progress & Analytics', route: '/progress', icon: BarChart3, family: 'home' },
  { id: 'history', label: 'History', route: '/history', icon: HistoryIcon, family: 'home' },

  // Row 3: System family
  { id: 'vault', label: 'Vault', route: '/vault', icon: ShieldCheck, family: 'system' },
  { id: 'settings', label: 'Settings', route: '/settings', icon: SettingsIcon, family: 'system' },
];

/**
 * Per-family color configurations (independent of active interface)
 */
export const HUB_FAMILY_CONFIG: Record<
  HubFamily,
  {
    seed: string;
    rgb: [number, number, number];
    darkGlyph: string;
  }
> = {
  study: {
    seed: '#0284C7', // Sky Blue
    rgb: [2, 132, 199],
    darkGlyph: '#5CC8F5',
  },
  finance: {
    seed: '#7C3AED', // Twilight Violet
    rgb: [124, 58, 237],
    darkGlyph: '#B79CFF',
  },
  home: {
    seed: '#2563EB', // Royal Blue
    rgb: [37, 99, 235],
    darkGlyph: '#8DB0FF',
  },
  system: {
    seed: '#4F46E5', // Midnight Indigo
    rgb: [79, 70, 229],
    darkGlyph: '#A5A0FF',
  },
};

export const HUB_SECTION_NAMES: Record<AppSection, string> = {
  home: 'Home',
  gym: 'Gym',
  nutrition: 'Nutrition',
  finance: 'Finance',
  study: 'Study',
  settings: 'Settings',
};
