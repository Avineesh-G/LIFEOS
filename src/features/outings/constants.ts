/**
 * LifeOS — Outing Expenses Constants & Palette
 */

import {
  Utensils,
  Car,
  Ticket,
  ShoppingBag,
  Hotel,
  Compass,
  LucideIcon,
} from 'lucide-react';
import { OutingCategory } from './types';

export const OUTING_THEME = {
  seed: '#8C500A',       // Saddle Brown
  lightText: '#78350F',  // Contrast >= 8:1 on light canvas #FDFDFD
  darkStrong: '#A05F0A', // Contrast >= 5.2:1 with white text
  darkTint: '#C88A58',   // Contrast >= 7.1:1 on dark canvas #121316
  pillContainer: {
    light: '#FDF7F2',
    dark: '#2A1806',
  },
};

export interface CategoryMeta {
  label: OutingCategory;
  icon: LucideIcon;
  color: string;
  badgeClass: string;
}

export const OUTING_CATEGORIES: CategoryMeta[] = [
  {
    label: 'Food',
    icon: Utensils,
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    label: 'Transport',
    icon: Car,
    color: '#3B82F6',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    label: 'Tickets & fun',
    icon: Ticket,
    color: '#C026D3',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
  },
  {
    label: 'Shopping',
    icon: ShoppingBag,
    color: '#EC4899',
    badgeClass: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20',
  },
  {
    label: 'Stay',
    icon: Hotel,
    color: '#8B5CF6',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    label: 'Other',
    icon: Compass,
    color: '#64748B',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
];

export const DEFAULT_ME_PERSON = {
  id: 'me',
  name: 'Me (You)',
  isMe: true,
};

export const MAX_RECEIPTS_PER_EXPENSE = 10;
export const MAX_IMAGE_LONG_EDGE = 1600;
export const THUMB_IMAGE_SIZE = 320;
export const JPEG_COMPRESSION_QUALITY = 0.72;
