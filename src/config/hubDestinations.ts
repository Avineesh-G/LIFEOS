import {
  CalendarDays,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  MapPin,
  LucideIcon,
  NotebookPen,
} from 'lucide-react';
import {
  HomeAppLogoIcon,
  ExerciseIcon,
  FlatwareIcon,
  Book2Icon,
  WalletIcon,
  ShoppingCartIcon,
  ListAltCheckIcon,
  LaundryIcon,
} from '../components/icons/MaterialSymbols';
import { AppSection } from '../theme/sectionSeedColors';

export type HubFamily = 'gym' | 'nutrition' | 'study' | 'finance' | 'home' | 'system' | 'history' | 'outing' | 'shopping' | 'vault' | 'notes';

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
  | 'settings'
  | 'notes';

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
  icon: HomeAppLogoIcon,
  family: 'home',
  matchRoutes: ['/', '/tasks', '/laundry'],
};

/**
 * Static typed array of all 12 editable-pool destinations.
 * In the hub, exactly 10 of these are rendered (the 2 pinned destinations are excluded).
 */
export const DESTINATIONS: HubDestination[] = [
  // Health & Body
  {
    id: 'gym',
    label: 'Gym',
    route: '/gym',
    icon: ExerciseIcon,
    family: 'gym',
    matchRoutes: ['/gym'],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    route: '/nutrition',
    icon: FlatwareIcon,
    family: 'nutrition',
    matchRoutes: ['/nutrition'],
  },

  // Focus, Planning & Mind
  {
    id: 'study',
    label: 'Study',
    route: '/study',
    icon: Book2Icon,
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
  {
    id: 'tasks',
    label: 'To-Do Tasks',
    route: '/tasks',
    icon: ListAltCheckIcon,
    family: 'home',
    matchRoutes: ['/tasks'],
  },
  {
    id: 'notes',
    label: 'Notes & Ideas',
    route: '/notes',
    icon: NotebookPen,
    family: 'notes',
    matchRoutes: ['/notes'],
  },

  // Finance & Commerce
  {
    id: 'spending',
    label: 'Spending',
    route: '/spending',
    icon: WalletIcon,
    family: 'finance',
    matchRoutes: ['/spending'],
  },
  {
    id: 'shopping',
    label: 'Shopping Lists',
    route: '/shopping',
    icon: ShoppingCartIcon,
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

  // Chores & Life History
  {
    id: 'laundry',
    label: 'Laundry',
    route: '/laundry',
    icon: LaundryIcon,
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

  // Security & Settings
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

const DEFAULT_FAMILY_SPEC = {
  seed: '#2DD4BF',
  rgb: [45, 212, 191] as [number, number, number],
  darkGlyph: '#2DD4BF',
  textAccent: '#2DD4BF',
  onAccent: '#FFFFFF',
  darkStrong: '#2DD4BF',
};

/**
 * Unified family color configurations
 */
export const HUB_FAMILY_CONFIG: Record<string, typeof DEFAULT_FAMILY_SPEC> = {
  gym: DEFAULT_FAMILY_SPEC,
  nutrition: DEFAULT_FAMILY_SPEC,
  study: DEFAULT_FAMILY_SPEC,
  finance: DEFAULT_FAMILY_SPEC,
  system: DEFAULT_FAMILY_SPEC,
  home: DEFAULT_FAMILY_SPEC,
  history: DEFAULT_FAMILY_SPEC,
  outing: DEFAULT_FAMILY_SPEC,
  shopping: DEFAULT_FAMILY_SPEC,
  vault: DEFAULT_FAMILY_SPEC,
  notes: DEFAULT_FAMILY_SPEC,
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
  notes: 'Notes & Ideas',
  timetable: 'Timetable',
  tasks: 'To-Do Tasks',
  laundry: 'Laundry',
};

export function getDestinationById(id: string): HubDestination | undefined {
  return DESTINATIONS.find(d => d.id === id);
}
