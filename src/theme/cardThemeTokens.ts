import { getActiveAccent } from './themeColorManager';

export type CategoryKey = 'gym' | 'nutrition' | 'study' | 'todo' | 'spending' | 'vault' | 'notes';

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  gym: 'var(--accent)',
  nutrition: 'var(--accent)',
  study: 'var(--accent)',
  todo: 'var(--accent)',
  spending: 'var(--accent)',
  vault: 'var(--accent)',
  notes: 'var(--accent)',
};

export function getCategoryBg(_cat: string): string {
  return getActiveAccent().primary;
}
