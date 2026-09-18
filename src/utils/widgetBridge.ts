import { registerPlugin, Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { format } from 'date-fns';
import type { AppData, StudySession, Task } from '../types';

export interface WidgetUpdaterPluginType {
  requestRefresh(): Promise<void>;
}

export const WidgetUpdater = registerPlugin<WidgetUpdaterPluginType>('WidgetUpdater');

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
 * Writes current widget snapshot to Capacitor Preferences (backed by Android SharedPreferences)
 * and immediately triggers native widget refresh via WidgetUpdater.requestRefresh().
 */
export async function syncWidgetData(data: AppData | null | undefined): Promise<void> {
  if (!data) return;

  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // 1. Streak count
    const streak = calculateWidgetStreak(data.studySessions);

    // 2. Tasks done today & total
    const todayTasks = (data.tasks || []).filter(t => (t?.dueDate || t?.date) === today);
    const tasksDone = todayTasks.filter(t => t.completed).length;
    const tasksTotal = todayTasks.length;

    // 3. Study minutes today
    const studyMinutes = (data.studySessions || [])
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    // Write snapshot keys to Preferences (CapacitorStorage)
    await Promise.all([
      Preferences.set({ key: 'widget_streak_count', value: String(streak) }),
      Preferences.set({ key: 'widget_tasks_done', value: String(tasksDone) }),
      Preferences.set({ key: 'widget_tasks_total', value: String(tasksTotal) }),
      Preferences.set({ key: 'widget_study_minutes_today', value: String(studyMinutes) }),
      Preferences.set({ key: 'widget_last_updated', value: new Date().toISOString() }),
    ]);

    // Request immediate native widget update on Android
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      await WidgetUpdater.requestRefresh();
    }
  } catch (err) {
    console.warn('[WidgetBridge] Failed to sync widget data:', err);
  }
}
