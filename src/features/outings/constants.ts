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
    color: 'var(--app-accent-text, #DE4B64)',
    badgeClass: 'bg-[var(--app-accent-soft)] text-[var(--app-accent-text)]',
  },
  {
    label: 'Transport',
    icon: Car,
    color: 'var(--app-accent-text, #DE4B64)',
    badgeClass: 'bg-[var(--app-accent-soft)] text-[var(--app-accent-text)]',
  },
  {
    label: 'Tickets & fun',
    icon: Ticket,
    color: 'var(--app-accent-text, #DE4B64)',
    badgeClass: 'bg-[var(--app-accent-soft)] text-[var(--app-accent-text)]',
  },
  {
    label: 'Shopping',
    icon: ShoppingBag,
    color: 'var(--app-accent-text, #DE4B64)',
    badgeClass: 'bg-[var(--app-accent-soft)] text-[var(--app-accent-text)]',
  },
  {
    label: 'Stay',
    icon: Hotel,
    color: 'var(--app-accent-text, #DE4B64)',
    badgeClass: 'bg-[var(--app-accent-soft)] text-[var(--app-accent-text)]',
  },
  {
    label: 'Other',
    icon: Compass,
    color: 'var(--app-accent-text, #DE4B64)',
    badgeClass: 'bg-[var(--app-accent-soft)] text-[var(--app-accent-text)]',
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
