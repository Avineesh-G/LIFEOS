import {
  CalendarDays,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  MapPin,
  LucideIcon,
  NotebookPen,
  Sun,
  Wand2,
  Flame,
  Brain,
  Mic,
  HardDrive as HardDriveIcon,
  Timer as TimerIcon,
  BookOpen as BookOpenIcon,
  Users as UsersIcon,
  Rocket as RocketIcon,
  Luggage as LuggageIcon,
  Scale as ScaleIcon,
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
  | 'calendar'
  | 'gym'
  | 'nutrition'
  | 'timetable'
  | 'spending'
  | 'shopping'
  | 'outings'
  | 'tasks'
  | 'laundry'
  | 'history'
  | 'vault'
  | 'settings'
  | 'notes'
  | 'drive'
  | 'focus'
  | 'journal'
  | 'circle'
  | 'projects'
  | 'trips'
  | 'decisions';

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
 * Static typed array of all editable-pool destinations sorted cleanly by domain.
 */
export const DESTINATIONS: HubDestination[] = [
  // ── 1. Planning & Calendar ──
  {
    id: 'calendar',
    label: 'Calendar',
    route: '/calendar',
    icon: CalendarDays,
    family: 'home',
    matchRoutes: ['/calendar'],
  },

  // ── 2. Academic & Notes ──
  {
    id: 'timetable',
    label: 'Timetable',
    route: '/timetable',
    icon: CalendarDays,
    family: 'home',
    matchRoutes: ['/timetable'],
  },
  {
    id: 'notes',
    label: 'Notes & Ideas',
    route: '/notes',
    icon: NotebookPen,
    family: 'notes',
    matchRoutes: ['/notes'],
  },
  {
    id: 'focus',
    label: 'Focus Studio',
    route: '/focus',
    icon: TimerIcon,
    family: 'study',
    matchRoutes: ['/focus'],
  },
  {
    id: 'journal',
    label: 'Daily Journal',
    route: '/journal',
    icon: BookOpenIcon,
    family: 'home',
    matchRoutes: ['/journal'],
  },
  {
    id: 'circle',
    label: 'Inner Circle',
    route: '/circle',
    icon: UsersIcon,
    family: 'home',
    matchRoutes: ['/circle'],
  },
  {
    id: 'projects',
    label: 'Projects',
    route: '/projects',
    icon: RocketIcon,
    family: 'study',
    matchRoutes: ['/projects'],
  },
  {
    id: 'trips',
    label: 'Trips & Packing',
    route: '/trips',
    icon: LuggageIcon,
    family: 'outing',
    matchRoutes: ['/trips'],
  },
  {
    id: 'decisions',
    label: 'Decisions',
    route: '/decisions',
    icon: ScaleIcon,
    family: 'notes',
    matchRoutes: ['/decisions'],
  },

  // ── 2. Daily Operations & Planning ──
  {
    id: 'tasks',
    label: 'To-Do Tasks',
    route: '/tasks',
    icon: ListAltCheckIcon,
    family: 'home',
    matchRoutes: ['/tasks'],
  },
  {
    id: 'laundry',
    label: 'Laundry',
    route: '/laundry',
    icon: LaundryIcon,
    family: 'home',
    matchRoutes: ['/laundry'],
  },

  // ── 3. Health & Fitness ──
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

  // ── 4. Finance & Commerce ──
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

  {
    id: 'drive',
    label: 'Drive & Docs',
    route: '/drive',
    icon: HardDriveIcon,
    family: 'home',
    matchRoutes: ['/drive'],
  },
  // ── 5. Security & System ──
  {
    id: 'history',
    label: 'History',
    route: '/history',
    icon: HistoryIcon,
    family: 'history',
    matchRoutes: ['/history'],
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
  calendar: 'Calendar',
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
  focus: 'Focus Studio',
  journal: 'Daily Journal',
  circle: 'Inner Circle',
  projects: 'Projects',
  trips: 'Trips & Packing',
  decisions: 'Decisions',
  timetable: 'Timetable',
  tasks: 'To-Do Tasks',
  laundry: 'Laundry',
  ai: 'Luna AI',
};

export function getDestinationById(id: string): HubDestination | undefined {
  return DESTINATIONS.find(d => d.id === id);
}
