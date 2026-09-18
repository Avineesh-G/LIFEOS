import { registerPlugin, Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { format } from 'date-fns';
import type { AppData, StudySession } from '../types';

export interface WidgetSnapshotData {
  streak: number;
  tasksDone: number;
  tasksTotal: number;
  studyMinutes: number;
}

export interface WidgetUpdaterPluginType {
  requestRefresh(): Promise<void>;
  updateSnapshot(options: WidgetSnapshotData): Promise<void>;
}

export const WidgetUpdater = registerPlugin<WidgetUpdaterPluginType>('WidgetUpdater');

// ── In-memory memoized / running values ──
let cachedStreak = 0;
let lastStudySessionsRef: StudySession[] | null = null;
let cachedStudyMinutesToday = 0;
let lastStudySessionsForMinutesRef: StudySession[] | null = null;
let lastDateStr = '';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Calculates current active streak based on consecutive study session days.
 * Returns 0 if last session is earlier than yesterday.
 */
export function calculateWidgetStreak(studySessions: StudySession[] = []): number {
  if (!Array.isArray(studySessions) || studySessions.length === 0) return 0;

  const validDates = studySessions
    .map(s => s.date)
    .filter((d): d is string => Boolean(d && typeof d === 'string'));

  const sortedDates = [...new Set(validDates)].sort();
  if (sortedDates.length === 0) return 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  const lastDate = sortedDates[sortedDates.length - 1];
  // If user hasn't studied today or yesterday, streak is broken
  if (lastDate !== today && lastDate !== yesterday) {
    return 0;
  }

  let currentStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]).getTime();
      const curr = new Date(sortedDates[i]).getTime();
      const diff = Math.round((curr - prev) / 86400000);
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    }
  }
  return currentStreak;
}

/**
 * Computes widget snapshot values with caching to avoid re-deriving
 * the entire streak history or study minutes on unrelated state updates (e.g. task toggles).
 */
export function getWidgetSnapshot(data: AppData | null | undefined): WidgetSnapshotData {
  if (!data) {
    return { streak: 0, tasksDone: 0, tasksTotal: 0, studyMinutes: 0 };
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const dateChanged = lastDateStr !== today;
  if (dateChanged) {
    lastDateStr = today;
  }

  // 1. Streak count (memoized on studySessions reference + current date)
  if (data.studySessions !== lastStudySessionsRef || dateChanged) {
    cachedStreak = calculateWidgetStreak(data.studySessions);
    lastStudySessionsRef = data.studySessions;
  }

  // 2. Study minutes today (memoized on studySessions reference + current date)
  if (data.studySessions !== lastStudySessionsForMinutesRef || dateChanged) {
    cachedStudyMinutesToday = (data.studySessions || [])
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    lastStudySessionsForMinutesRef = data.studySessions;
  }

  // 3. Tasks done today & total (single-pass linear scan with zero intermediate array allocations)
  let tasksDone = 0;
  let tasksTotal = 0;
  const tasks = data.tasks || [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const taskDate = t?.dueDate || t?.date;
    if (taskDate === today) {
      tasksTotal++;
      if (t.completed) tasksDone++;
    }
  }

  return {
    streak: cachedStreak,
    tasksDone,
    tasksTotal,
    studyMinutes: cachedStudyMinutesToday,
  };
}

/**
 * Writes current widget snapshot to native widget storage.
 * Prioritizes the fast, single-call native updateSnapshot plugin method.
 * Runs non-blocking and never throws.
 */
export async function syncWidgetData(data: AppData | null | undefined): Promise<void> {
  if (!data) return;

  try {
    const snapshot = getWidgetSnapshot(data);

    // 1. Native Android path: single fast IPC call, resolved instantly on native side
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        await WidgetUpdater.updateSnapshot(snapshot);
        return;
      } catch (nativeErr) {
        console.warn('[WidgetBridge] Native updateSnapshot error, falling back to Preferences:', nativeErr);
      }
    }

    // 2. Fallback path (or non-Android platforms)
    await Promise.all([
      Preferences.set({ key: 'widget_streak_count', value: String(snapshot.streak) }),
      Preferences.set({ key: 'widget_tasks_done', value: String(snapshot.tasksDone) }),
      Preferences.set({ key: 'widget_tasks_total', value: String(snapshot.tasksTotal) }),
      Preferences.set({ key: 'widget_study_minutes_today', value: String(snapshot.studyMinutes) }),
      Preferences.set({ key: 'widget_last_updated', value: new Date().toISOString() }),
    ]);

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      WidgetUpdater.requestRefresh().catch(() => {});
    }
  } catch (err) {
    console.warn('[WidgetBridge] Failed to sync widget data:', err);
  }
}

/**
 * Defers and debounces widget updates so they NEVER collide with UI render frames,
 * completion animations, or haptic vibrations.
 */
export function scheduleWidgetSync(data: AppData | null | undefined, delayMs: number = 150): void {
  if (!data) return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    // Fire-and-forget: execute asynchronously after UI paint has settled
    syncWidgetData(data).catch(() => {});
  }, delayMs);
}
