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

/**
 * Retrieves a daily set of distinct quotes (default 5, spanning multiple pillars)
 * with guaranteed non-repeating rotation across days.
 */
export function getDailyQuotes(count: number = 5): QuoteItem[] {
  const todayStr = getTodayString();

  let pool: number[] = [];
  let currentIndex = 0;
  let lastShownDate = '';

  try {
    const savedPool = localStorage.getItem(STORAGE_KEY_POOL);
    const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE);

    if (savedPool) {
      pool = JSON.parse(savedPool);
    }
    if (savedIndex !== null) {
      currentIndex = parseInt(savedIndex, 10);
    }
    if (savedDate) {
      lastShownDate = savedDate;
    }
  } catch (err) {
    console.warn('[QuoteEngine] Storage read error, using fresh pool:', err);
  }

  // 1. If pool is uninitialized, empty, or pool size changed (e.g. new quotes added),
  // generate a fresh Fisher-Yates shuffled list of all IDs
  const allIds = QUOTES_POOL.map(q => q.id);
  if (!Array.isArray(pool) || pool.length === 0 || pool.length !== allIds.length) {
    pool = shuffle(allIds);
    currentIndex = 0;
    lastShownDate = todayStr;
    persist(pool, currentIndex, todayStr);
  }

  // 2. If it's a new day, advance the index by the count so a fresh set appears
  if (lastShownDate !== todayStr) {
    currentIndex = (currentIndex + count) % pool.length;
    lastShownDate = todayStr;
    persist(pool, currentIndex, todayStr);
  }

  // 3. Collect `count` distinct quotes from the current pointer
  const selected: QuoteItem[] = [];
  for (let i = 0; i < count; i++) {
    const quoteId = pool[(currentIndex + i) % pool.length];
    const found = QUOTES_POOL.find(q => q.id === quoteId);
    if (found) {
      selected.push(found);
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
