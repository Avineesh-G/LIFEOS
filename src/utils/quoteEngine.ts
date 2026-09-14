import { QUOTES_POOL, QuoteItem } from '../data/quotes';

const STORAGE_KEY_SEEN = 'lifeos_daily_quote_seen';
const STORAGE_KEY_QUEUE = 'lifeos_daily_quote_queue';
const STORAGE_KEY_DATE = 'lifeos_daily_quote_date';

export const PILLARS = ['studies', 'career', 'finance', 'time', 'character'] as const;
export type PillarType = (typeof PILLARS)[number];

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
 * Generates an interleaved balanced deck spanning all 5 pillars so
 * consecutive quotes rotate cleanly through different life domains.
 */
function generateDailyDeck(): number[] {
  const pillarPools: Record<PillarType, number[]> = {
    studies: shuffle(QUOTES_POOL.filter(q => q.category === 'studies').map(q => q.id)),
    career: shuffle(QUOTES_POOL.filter(q => q.category === 'career').map(q => q.id)),
    finance: shuffle(QUOTES_POOL.filter(q => q.category === 'finance').map(q => q.id)),
    time: shuffle(QUOTES_POOL.filter(q => q.category === 'time').map(q => q.id)),
    character: shuffle(QUOTES_POOL.filter(q => q.category === 'character').map(q => q.id)),
  };

  const deck: number[] = [];
  let added = true;
  let round = 0;

  while (added) {
    added = false;
    for (const pillar of PILLARS) {
      if (round < pillarPools[pillar].length) {
        deck.push(pillarPools[pillar][round]);
        added = true;
      }
    }
    round++;
  }

  return deck;
}

/**
 * Loads today's quote state or resets for a new calendar day.
 * Ensures quotes NEVER repeat on the same day.
 */
function getTodayState(): { seenIds: number[]; queueIds: number[]; date: string } {
  const today = getTodayString();
  try {
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
    if (savedDate === today) {
      const seenIds: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY_SEEN) || '[]');
      let queueIds: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY_QUEUE) || '[]');
      if (queueIds.length === 0 && seenIds.length > 0) {
        // All quotes have been viewed today, filter out already seen
        queueIds = generateDailyDeck().filter(id => !seenIds.includes(id));
        if (queueIds.length === 0) {
          // If all 285 were exhausted, restart fresh cycle
          queueIds = generateDailyDeck();
          seenIds.length = 0;
        }
      }
      return { seenIds, queueIds, date: today };
    }
  } catch (err) {
    console.warn('[QuoteEngine] Storage parse error, resetting state:', err);
  }

  // Brand new day: reset seen and build fresh balanced deck
  const newQueue = generateDailyDeck();
  const newState = { seenIds: [], queueIds: newQueue, date: today };
  persistState(newState.seenIds, newState.queueIds, today);
  return newState;
}

function persistState(seenIds: number[], queueIds: number[], date: string) {
  try {
    localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(seenIds));
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queueIds));
    localStorage.setItem(STORAGE_KEY_DATE, date);
  } catch (err) {
    console.warn('[QuoteEngine] Storage persist error:', err);
  }
}

export interface DailyQuoteResult {
  quote: QuoteItem;
  seenIndex: number;
  totalSeenToday: number;
}

/**
 * Retrieves the current active quote for today without advancing.
 * If no quote was viewed yet, advances to the first quote.
 */
export function getCurrentDailyQuote(): DailyQuoteResult {
  const state = getTodayState();
  if (state.seenIds.length > 0) {
    const lastId = state.seenIds[state.seenIds.length - 1];
    const found = QUOTES_POOL.find(q => q.id === lastId);
    if (found) {
      return { quote: found, seenIndex: state.seenIds.length - 1, totalSeenToday: state.seenIds.length };
    }
  }

  // Draw first quote of today
  return advanceToNextQuote();
}

/**
 * Advances to the next quote in today's deck.
 * Guaranteed: Quotes already shown today will NOT repeat.
 */
export function advanceToNextQuote(preferredPillar?: PillarType): DailyQuoteResult {
  const state = getTodayState();
  let nextId: number | undefined;

  if (preferredPillar) {
    // Find next unviewed quote matching the selected pillar
    const matchIdx = state.queueIds.findIndex(id => {
      const q = QUOTES_POOL.find(item => item.id === id);
      return q && q.category === preferredPillar;
    });
    if (matchIdx !== -1) {
      nextId = state.queueIds.splice(matchIdx, 1)[0];
    }
  }

  if (nextId === undefined) {
    if (state.queueIds.length > 0) {
      nextId = state.queueIds.shift();
    } else {
      // Pool exhausted for today, refill
      state.queueIds = generateDailyDeck().filter(id => !state.seenIds.includes(id));
      if (state.queueIds.length === 0) {
        state.queueIds = generateDailyDeck();
        state.seenIds = [];
      }
      nextId = state.queueIds.shift();
    }
  }

  if (nextId !== undefined) {
    state.seenIds.push(nextId);
    persistState(state.seenIds, state.queueIds, state.date);
    const found = QUOTES_POOL.find(q => q.id === nextId) || QUOTES_POOL[0];
    return { quote: found, seenIndex: state.seenIds.length - 1, totalSeenToday: state.seenIds.length };
  }

  return { quote: QUOTES_POOL[0], seenIndex: 0, totalSeenToday: 1 };
}

/**
 * Moves backward to an earlier quote shown today.
 */
export function getPreviousSeenQuote(currentSeenIndex: number): DailyQuoteResult {
  const state = getTodayState();
  if (state.seenIds.length > 0) {
    const targetIdx = Math.max(0, currentSeenIndex - 1);
    const targetId = state.seenIds[targetIdx];
    const found = QUOTES_POOL.find(q => q.id === targetId);
    if (found) {
      return { quote: found, seenIndex: targetIdx, totalSeenToday: state.seenIds.length };
    }
  }
  return getCurrentDailyQuote();
}

/**
 * Shuffles to another unviewed quote from today's deck.
 */
export function shuffleToNextQuote(): DailyQuoteResult {
  return advanceToNextQuote();
}

/**
 * Backward compatibility: Retrieves distinct quotes spanning all 5 LifeOS pillars.
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
      const offset = (Math.abs(dayNumber) + i * 3) % pool.length;
      selected.push(pool[offset]);
    }
  }

  return selected.length > 0 ? selected : QUOTES_POOL.slice(0, count);
}

/**
 * Backward compatibility: Retrieves a single daily quote.
 */
export function getDailyQuote(): QuoteItem {
  return getCurrentDailyQuote().quote;
}

/**
 * Dynamically computes a comfortable marquee animation duration
 */
export function calculateMarqueeDuration(quotes: QuoteItem[] | string): number {
  let text = '';
  if (typeof quotes === 'string') {
    text = quotes;
  } else if (Array.isArray(quotes)) {
    text = quotes.map(q => `${q.quote} ${q.author}`).join(' ');
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const calculated = Math.round(wordCount * 1.15) + 14;
  return Math.max(25, Math.min(180, calculated));
}
