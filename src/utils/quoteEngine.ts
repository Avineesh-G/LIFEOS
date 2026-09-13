import { QUOTES_POOL, QuoteItem } from '../data/quotes';

const STORAGE_KEY_POOL = 'lifeos_quote_pool';
const STORAGE_KEY_INDEX = 'lifeos_quote_index';
const STORAGE_KEY_DATE = 'lifeos_quote_date';

/**
 * Fisher-Yates unbiased shuffle algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Formats date as YYYY-MM-DD in local time
 */
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const PILLARS = ['studies', 'career', 'finance', 'time', 'character'] as const;
export type PillarType = (typeof PILLARS)[number];

/**
 * Retrieves a daily set of distinct quotes guaranteed to span all 5 LifeOS pillars:
 * Studies, Career, Finance, Time, and Character.
 * Rotates deterministically across days with 0 repeats until the pillar pool is exhausted.
 */
export function getDailyQuotes(count: number = 5): QuoteItem[] {
  const todayStr = getTodayString();
  const [y, m, d] = todayStr.split('-').map(Number);
  const dayNumber = Math.floor(new Date(y, m - 1, d).getTime() / (1000 * 60 * 60 * 24));

  const selected: QuoteItem[] = [];
  for (let i = 0; i < count; i++) {
    const pillar = PILLARS[i % PILLARS.length];
    const pool = QUOTES_POOL.filter(q => q.category === pillar);
    if (pool.length > 0) {
      // Deterministic offset per pillar
      const offset = (Math.abs(dayNumber) + i * 3) % pool.length;
      selected.push(pool[offset]);
    }
  }

  return selected.length > 0 ? selected : QUOTES_POOL.slice(0, count);
}

/**
 * Retrieves a single daily quote (backward compatible).
 */
export function getDailyQuote(): QuoteItem {
  const quotes = getDailyQuotes(1);
  return quotes[0] || QUOTES_POOL[0];
}

/**
 * Persists quote rotation state to localStorage
 */
function persist(pool: number[], index: number, date: string) {
  try {
    localStorage.setItem(STORAGE_KEY_POOL, JSON.stringify(pool));
    localStorage.setItem(STORAGE_KEY_INDEX, String(index));
    localStorage.setItem(STORAGE_KEY_DATE, date);
  } catch (err) {
    console.warn('[QuoteEngine] Storage persist error:', err);
  }
}

/**
 * Dynamically computes a comfortable marquee animation duration
 * based on total word count (~1.1 second per word, natural reading speed).
 */
export function calculateMarqueeDuration(quotes: QuoteItem[] | string): number {
  let text = '';
  if (typeof quotes === 'string') {
    text = quotes;
  } else if (Array.isArray(quotes)) {
    text = quotes.map(q => `${q.quote} ${q.author}`).join(' ');
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  // Natural comfortable reading pace: ~1.15s per word plus 12s baseline
  const calculated = Math.round(wordCount * 1.15) + 14;
  return Math.max(25, Math.min(180, calculated));
}
