import {
  Dumbbell,
  Utensils,
  Shirt,
  BarChart3,
  History,
  CalendarDays,
  BookOpen,
  Wallet,
  CheckSquare,
  ShieldCheck,
  Settings,
  ShoppingBag,
  LucideIcon
} from 'lucide-react';

export type NavModuleId =
  | 'gym'
  | 'nutrition'
  | 'laundry'
  | 'progress'
  | 'history'
  | 'timetable'
  | 'study'
  | 'spending'
  | 'shopping'
  | 'tasks'
  | 'vault'
  | 'settings';

export interface NavModuleDefinition {
  id: NavModuleId;
  label: string;
  path: string;
  icon: LucideIcon;
  color?: string;
  description?: string;
}

export const NAV_MODULE_REGISTRY: NavModuleDefinition[] = [
  {
    id: 'gym',
    label: 'Gym',
    path: '/gym',
    icon: Dumbbell,
    color: 'text-emerald-500 dark:text-emerald-400',
    description: 'Workouts, splits, and exercise logs'
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    path: '/nutrition',
    icon: Utensils,
    color: 'text-orange-500 dark:text-orange-400',
    description: 'Diet, macro targets, and hydration'
  },
  {
    id: 'tasks',
    label: 'To-Do Tasks',
    path: '/tasks',
    icon: CheckSquare,
    color: 'text-emerald-500 dark:text-emerald-400',
    description: 'Deadlines, daily priorities, and tasks'
  },
  {
    id: 'timetable',
    label: 'Timetable',
    path: '/timetable',
    icon: CalendarDays,
    color: 'text-sky-500 dark:text-sky-400',
    description: 'Class schedule, rooms, and timetable'
  },
  {
    id: 'study',
    label: 'Study',
    path: '/study',
    icon: BookOpen,
    color: 'text-indigo-500 dark:text-indigo-400',
    description: 'Pomodoro timer, doubts, and study analytics'
  },
  {
    id: 'spending',
    label: 'Spending',
    path: '/spending',
    icon: Wallet,
    color: 'text-amber-500 dark:text-amber-400',
    description: 'Expense tracking and monthly budget'
  },
  {
    id: 'shopping',
    label: 'Shopping Lists',
    path: '/shopping',
    icon: ShoppingBag,
    color: 'text-orange-500 dark:text-orange-400',
    description: 'Checklists, grocery trips, and outing templates'
  },
  {
    id: 'laundry',
    label: 'Laundry',
    path: '/laundry',
    icon: Shirt,
    color: 'text-teal-500 dark:text-teal-400',
    description: 'Clothes count and return date tracker'
  },
  {
    id: 'progress',
    label: 'Progress & Analytics',
    path: '/progress',
    icon: BarChart3,
    color: 'text-purple-500 dark:text-purple-400',
    description: 'Habit streaks and macro trends'
  },
  {
    id: 'history',
    label: 'History',
    path: '/history',
    icon: History,
    color: 'text-violet-500 dark:text-violet-400',
    description: 'Historical archive of past days'
  },
  {
    id: 'vault',
    label: 'Vault',
    path: '/vault',
    icon: ShieldCheck,
    color: 'text-emerald-500 dark:text-emerald-400',
    description: 'Biometric encrypted credential vault'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    color: 'text-slate-500 dark:text-slate-400',
    description: 'Preferences, notifications, and security'
  },
];

export interface NavConfig {
  slot1: NavModuleId;
  slot2: NavModuleId;
}

export const DEFAULT_NAV_CONFIG: NavConfig = {
  slot1: 'gym',
  slot2: 'nutrition',
};

export function getModuleById(id: NavModuleId): NavModuleDefinition {
  const found = NAV_MODULE_REGISTRY.find(m => m.id === id);
  if (found) return found;
  return NAV_MODULE_REGISTRY[0];
}
