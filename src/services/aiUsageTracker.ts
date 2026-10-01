import { getTrackAppUsage } from '../utils/aiSecurity.ts';
import { format, subDays, parseISO, isAfter } from 'date-fns';

export interface DailyUsageRecord {
  date: string; // 'yyyy-MM-dd'
  screens: Record<string, number>;
  lastUsedAt: string;
}

const USAGE_STORAGE_KEY = 'lifeos_ai_app_usage';
const MAX_RETENTION_DAYS = 90;

/**
 * Loads usage history from LocalStorage and prunes entries older than 90 days.
 */
export function loadUsageHistory(): Record<string, DailyUsageRecord> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return {};

    const data: Record<string, DailyUsageRecord> = JSON.parse(raw);
    const cutoffDate = subDays(new Date(), MAX_RETENTION_DAYS);

    // Prune stale records > 90 days
    const pruned: Record<string, DailyUsageRecord> = {};
    Object.entries(data).forEach(([dateStr, record]) => {
      try {
        if (isAfter(parseISO(dateStr), cutoffDate)) {
          pruned[dateStr] = record;
        }
      } catch {}
    });

    return pruned;
  } catch {
    return {};
  }
}

/**
 * Saves usage records to LocalStorage.
 */
function saveUsageHistory(history: Record<string, DailyUsageRecord>): void {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

/**
 * Records a screen visit for the current day.
 * Only stores aggregated counts and last-used timestamp — NO private message or content.
 */
export function recordScreenView(screenName: string): void {
  if (!getTrackAppUsage() || !screenName) return;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const history = loadUsageHistory();

  const currentRecord = history[todayStr] || {
    date: todayStr,
    screens: {},
    lastUsedAt: new Date().toISOString(),
  };

  currentRecord.screens[screenName] = (currentRecord.screens[screenName] || 0) + 1;
  currentRecord.lastUsedAt = new Date().toISOString();

  history[todayStr] = currentRecord;
  saveUsageHistory(history);
}

/**
 * Summarizes aggregated app usage over the last N days (default 30 days) for AI context.
 */
export function getAggregatedUsageSummary(days: number = 30): string {
  if (!getTrackAppUsage()) {
    return 'App usage tracking is currently disabled by user.';
  }

  const history = loadUsageHistory();
  const screenTotals: Record<string, number> = {};
  let totalOpens = 0;

  Object.values(history).forEach((record) => {
    Object.entries(record.screens || {}).forEach(([screen, count]) => {
      screenTotals[screen] = (screenTotals[screen] || 0) + count;
      totalOpens += count;
    });
  });

  if (totalOpens === 0) {
    return 'App usage history: No screen visits recorded yet.';
  }

  const sortedScreens = Object.entries(screenTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([screen, count]) => `${screen}: ${count} visits`);

  return `App Usage (Last ${days} days, ${totalOpens} total opens): Most visited: ${sortedScreens.join(', ')}`;
}

/**
 * Wipes local app usage history.
 */
export function clearUsageHistory(): void {
  try {
    localStorage.removeItem(USAGE_STORAGE_KEY);
  } catch {}
}
