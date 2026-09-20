import {
  Home,
  Dumbbell,
  Utensils,
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

export type HubFamily = 'gym' | 'nutrition' | 'study' | 'finance' | 'home' | 'system';

export type DestinationId =
  | 'gym'
  | 'nutrition'
  | 'study'
  | 'timetable'
  | 'spending'
  | 'shopping'
  | 'tasks'
  | 'laundry'
  | 'progress'
  | 'history'
  | 'vault'
  | 'settings';

export interface HubDestination {
  id: DestinationId;
  label: string;
  route: string;
  icon: LucideIcon;
  family: HubFamily;
  matchRoutes: string[];
}

export interface HomeDestination {
  id: 'home';
  label: string;
  route: string;
  icon: LucideIcon;
  family: 'home';
  matchRoutes: string[];
}

export const HOME_DESTINATION: HomeDestination = {
  id: 'home',
  label: 'Home',
  route: '/',
  icon: Home,
  family: 'home',
  matchRoutes: ['/', '/tasks', '/progress', '/history', '/laundry'],
};

/**
 * Static typed array of all 12 editable-pool destinations.
 * In the hub, exactly 10 of these are rendered (the 2 pinned destinations are excluded).
 */
export const DESTINATIONS: HubDestination[] = [
  // Gym & Nutrition
  {
    id: 'gym',
    label: 'Gym',
    route: '/gym',
    icon: Dumbbell,
    family: 'gym',
    matchRoutes: ['/gym'],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    route: '/nutrition',
    icon: Utensils,
    family: 'nutrition',
    matchRoutes: ['/nutrition'],
  },

  // Study family
  {
    id: 'study',
    label: 'Study',
    route: '/study',
    icon: BookOpen,
    family: 'study',
    matchRoutes: ['/study'],
  },
  {
    id: 'timetable',
    label: 'Timetable',
    route: '/timetable',
    icon: CalendarDays,
    family: 'study',
    matchRoutes: ['/timetable'],
  },

  // Finance family
  {
    id: 'spending',
    label: 'Spending',
    route: '/spending',
    icon: Wallet,
    family: 'finance',
    matchRoutes: ['/spending'],
  },
  {
    id: 'shopping',
    label: 'Shopping Lists',
    route: '/shopping',
    icon: ShoppingBag,
    family: 'finance',
    matchRoutes: ['/shopping'],
  },

  // Home tools family
  {
    id: 'tasks',
    label: 'To-Do Tasks',
    route: '/tasks',
    icon: CheckSquare,
    family: 'home',
    matchRoutes: ['/tasks'],
  },
  {
    id: 'laundry',
    label: 'Laundry',
    route: '/laundry',
    icon: Shirt,
    family: 'home',
    matchRoutes: ['/laundry'],
  },
  {
    id: 'progress',
    label: 'Progress & Analytics',
    route: '/progress',
    icon: BarChart3,
    family: 'home',
    matchRoutes: ['/progress'],
  },
  {
    id: 'history',
    label: 'History',
    route: '/history',
    icon: HistoryIcon,
    family: 'home',
    matchRoutes: ['/history'],
  },

  // System family
  {
    id: 'vault',
    label: 'Vault',
    route: '/vault',
    icon: ShieldCheck,
    family: 'system',
    matchRoutes: ['/vault'],
  },
  {
    id: 'settings',
    label: 'Settings',
    route: '/settings',
    icon: SettingsIcon,
    family: 'system',
    matchRoutes: ['/settings'],
  },
];

/**
 * Backward compatibility alias for DESTINATIONS
 */
export const HUB_DESTINATIONS = DESTINATIONS;

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
  gym: {
    seed: '#E11D48', // Rose / Gym
    rgb: [225, 29, 72],
    darkGlyph: '#FB7185',
  },
  nutrition: {
    seed: '#F5A623', // Amber / Nutrition
    rgb: [245, 166, 35],
    darkGlyph: '#FBBF24',
  },
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

export function getDestinationById(id: string): HubDestination | undefined {
  return DESTINATIONS.find(d => d.id === id);
}
