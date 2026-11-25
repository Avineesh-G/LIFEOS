import { format, subDays, addDays } from 'date-fns';
import type { AppData, DayReview, JournalEntry, Task } from '../types';

export interface DailyOutputSummary {
  tasksDone: number;
  tasksTotal: number;
  focusMinutes: number;
  workoutDone: boolean;
  workoutType: string | null;
  caloriesLogged: number;
}

export function getDailyOutputSummary(data: AppData, dateStr: string): DailyOutputSummary {
  const dayTasks = (data.tasks || []).filter((t) => t.date === dateStr);
  const tasksDone = dayTasks.filter((t) => t.completed).length;
  const tasksTotal = dayTasks.length;

  const focusMinutes = (data.studySessions || [])
    .filter((s) => s.date === dateStr)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const dayWorkout = (data.workoutLogs || []).find((w) => w.date === dateStr);
  const nutritionLog = (data.nutritionLogs || []).find((n) => n.date === dateStr);

  return {
    tasksDone,
    tasksTotal,
    focusMinutes,
    workoutDone: Boolean(dayWorkout),
    workoutType: dayWorkout?.type || null,
    caloriesLogged: Math.round(nutritionLog?.dailyTotal || 0),
  };
}

export function calculateJournalStreak(
  entries: JournalEntry[] = [],
  legacyReviews: DayReview[] = []
): number {
  const activeDates = new Set<string>();
  entries.forEach((e) => {
    const hasContent =
      Boolean(e.morningEnergy) ||
      Boolean(e.nightMood) ||
      Boolean(e.morningFocusTheme?.trim()) ||
      Boolean(e.morningNote?.trim()) ||
      Boolean(e.gratitude?.trim()) ||
      Boolean(e.improve?.trim()) ||
      Boolean(e.brainDump?.trim()) ||
      (e.wins && e.wins.some((w) => w.trim().length > 0));
    if (hasContent && e.date) activeDates.add(e.date);
  });
  legacyReviews.forEach((r) => {
    if (r.date) activeDates.add(r.date);
  });

  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (activeDates.has(key)) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function getRolloverCandidates(tasks: Task[] = [], referenceDateStr: string): Task[] {
  return tasks.filter((t) => !t.completed && t.date <= referenceDateStr);
}

export function getTomorrowDateStr(referenceDateStr: string): string {
  const parts = referenceDateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    const base = new Date(parts[0], parts[1] - 1, parts[2]);
    return format(addDays(base, 1), 'yyyy-MM-dd');
  }
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

export function resolveEntryForDate(
  entries: JournalEntry[] = [],
  legacyReviews: DayReview[] = [],
  dateStr: string
): JournalEntry {
  const existing = entries.find((e) => e.date === dateStr);
  if (existing) return existing;

  const legacy = legacyReviews.find((r) => r.date === dateStr);
  const nowIso = new Date().toISOString();
  return {
    id: `journal_${dateStr}`,
    date: dateStr,
    morningFocusTheme: '',
    morningPriorityTaskIds: [],
    morningNote: '',
    nightMood:
      legacy && typeof legacy.mood === 'number' && legacy.mood >= 1 && legacy.mood <= 5
        ? (legacy.mood as 1 | 2 | 3 | 4 | 5)
        : undefined,
    wins: legacy?.accomplished ? [legacy.accomplished] : ['', '', ''],
    gratitude: '',
    improve: legacy?.improve || '',
    brainDump: '',
    hideFromAi: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

