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
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  MapPin,
  LucideIcon,
} from 'lucide-react';
import { AppSection } from '../theme/sectionSeedColors';

export type HubFamily = 'gym' | 'nutrition' | 'study' | 'finance' | 'home' | 'system' | 'history' | 'outing' | 'shopping' | 'vault';

export type DestinationId =
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
  matchRoutes: ['/', '/tasks', '/laundry'],
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
    family: 'shopping',
    matchRoutes: ['/shopping'],
  },
  {
    id: 'outings',
    label: 'Outing Expenses',
    route: '/outings',
    icon: MapPin,
    family: 'outing',
    matchRoutes: ['/outings'],
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
    id: 'history',
    label: 'History',
    route: '/history',
    icon: HistoryIcon,
    family: 'history',
    matchRoutes: ['/history'],
  },

  // System family
  {
    id: 'vault',
    label: 'Vault',
    route: '/vault',
    icon: ShieldCheck,
    family: 'vault',
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

import { PALETTE } from '../theme/palette';

/**
 * Per-family color configurations (independent of active interface)
 */
export const HUB_FAMILY_CONFIG: Record<
  HubFamily,
  {
    seed: string;
    rgb: [number, number, number];
    darkGlyph: string;
    textAccent: string;
    onAccent: string;
    darkStrong: string;
  }
> = {
  gym: {
    seed: PALETTE.gym.seed, // Coral Crimson #E11D48
    rgb: [225, 29, 72],
    darkGlyph: PALETTE.gym.darkTint, // #FB7185
    textAccent: PALETTE.gym.textAccent,
    onAccent: PALETTE.gym.onAccent,
    darkStrong: PALETTE.gym.darkStrong,
  },
  nutrition: {
    seed: PALETTE.nutrition.seed, // Solar Amber #F5A623
    rgb: [245, 166, 35],
    darkGlyph: PALETTE.nutrition.darkTint, // #FBC15E
    textAccent: PALETTE.nutrition.textAccent,
    onAccent: PALETTE.nutrition.onAccent,
    darkStrong: PALETTE.nutrition.darkStrong,
  },
  study: {
    seed: PALETTE.study.seed, // Lagoon Cyan #0891B2
    rgb: [8, 145, 178],
    darkGlyph: PALETTE.study.darkTint, // #80D2ED
    textAccent: PALETTE.study.textAccent,
    onAccent: PALETTE.study.onAccent,
    darkStrong: PALETTE.study.darkStrong,
  },
  finance: {
    seed: PALETTE.finance.seed, // Forest Green #15803D
    rgb: [21, 128, 61],
    darkGlyph: PALETTE.finance.darkTint, // #82CB92
    textAccent: PALETTE.finance.textAccent,
    onAccent: PALETTE.finance.onAccent,
    darkStrong: PALETTE.finance.darkStrong,
  },
  home: {
    seed: PALETTE.home.seed, // Royal Blue #2563EB
    rgb: [37, 99, 235],
    darkGlyph: PALETTE.home.darkTint, // #8DB0FF
    textAccent: PALETTE.home.textAccent,
    onAccent: PALETTE.home.onAccent,
    darkStrong: PALETTE.home.darkStrong,
  },
  system: {
    seed: PALETTE.settings.seed, // Slate #475569
    rgb: [71, 85, 105],
    darkGlyph: PALETTE.settings.darkTint, // #A7AEBB
    textAccent: PALETTE.settings.textAccent,
    onAccent: PALETTE.settings.onAccent,
    darkStrong: PALETTE.settings.darkStrong,
  },
  history: {
    seed: PALETTE.history.seed, // Burgundy #8C1D40
    rgb: [140, 29, 64],
    darkGlyph: PALETTE.history.darkTint, // #D66FA0
    textAccent: PALETTE.history.textAccent,
    onAccent: PALETTE.history.onAccent,
    darkStrong: PALETTE.history.darkStrong,
  },
  outing: {
    seed: PALETTE.outing.seed, // Saddle Brown #8C500A
    rgb: [140, 80, 10],
    darkGlyph: PALETTE.outing.darkTint, // #C88A58
    textAccent: PALETTE.outing.textAccent,
    onAccent: PALETTE.outing.onAccent,
    darkStrong: PALETTE.outing.darkStrong,
  },
  shopping: {
    seed: '#172554', // Deep Midnight Navy
    rgb: [23, 37, 84],
    darkGlyph: '#93C5FD',
    textAccent: '#1E3A8A',
    onAccent: '#FFFFFF',
    darkStrong: '#254BB5',
  },
  vault: {
    seed: '#2034A0', // Cyber Cobalt Navy
    rgb: [32, 52, 160],
    darkGlyph: '#818CF8',
    textAccent: '#1E40AF',
    onAccent: '#FFFFFF',
    darkStrong: '#3B82F6',
  },
};

export const HUB_SECTION_NAMES: Record<AppSection, string> = {
  home: 'Home',
  gym: 'Gym',
  nutrition: 'Nutrition',
  finance: 'Finance',
  study: 'Study',
  settings: 'Settings',
  history: 'History',
  outing: 'Outing Expenses',
  shopping: 'Shopping Lists',
  vault: 'Vault',
};

export function getDestinationById(id: string): HubDestination | undefined {
  return DESTINATIONS.find(d => d.id === id);
}
