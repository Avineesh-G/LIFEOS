import { format, differenceInMinutes, parse, isBefore, startOfDay, addDays } from 'date-fns';
import type { AppData, Task, TimetableBlock } from '../types';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type SuggestionModule = 'study' | 'gym' | 'shopping' | 'laundry' | 'timetable' | 'tasks';

export interface TimeWindowInfo {
  type: 'in_progress' | 'upcoming_window' | 'clear_rest_of_day' | 'no_events_today';
  currentBlock: TimetableBlock | null;
  nextBlock: TimetableBlock | null;
  availableMinutes: number | null;
  minutesUntilNext: number | null;
  summaryText: string;
}

export interface RecommendationInfo {
  module: SuggestionModule;
  type: 'focus_task' | 'workout' | 'study_session' | 'shopping' | 'prepare_tomorrow' | 'all_clear' | 'plan_day';
  badgeLabel: string;
  title: string;
  subtitle: string;
  metadata: string;
  durationMinutes: number;
  task?: Task;
  actionLabel: string;
  actionRoute: string;
  actionContext?: Record<string, any>;
}

export interface SmartSuggestion {
  id: string;
  module: SuggestionModule;
  label: string;
  sublabel?: string;
  actionRoute: string;
  actionContext?: Record<string, any>;
}

export interface AttentionItem {
  id: string;
  text: string;
  severity: 'urgent' | 'info';
  actionRoute?: string;
}

export interface DailyBriefData {
  greeting: string;
  timeOfDay: TimeOfDay;
  timeOfDayLabel: string;
  contextSummary: string;
  timeWindow: TimeWindowInfo;
  recommendation: RecommendationInfo;
  smartSuggestions: SmartSuggestion[];
  attention: AttentionItem | null;
  progressSummary: {
    completedCount: number;
    totalCount: number;
    studyMinutes: number;
    studyFormatted: string;
    workoutDone: boolean;
    workoutType?: string;
    hasActivity: boolean;
  };
  isAllClear: boolean;
}

/**
 * Extracts user's first name from cached authentication profile.
 */
export function getCachedUserName(): string {
  try {
    const raw = localStorage.getItem('lifeos_cached_auth_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.displayName) {
        return user.displayName.split(' ')[0];
      }
      if (user?.email) {
        const handle = user.email.split('@')[0];
        return handle.charAt(0).toUpperCase() + handle.slice(1);
      }
    }
  } catch {}
  return '';
}

/**
 * Extracts estimated duration in minutes from task fields or task title.
 * Defaults to 25 minutes if unspecified.
 */
export function extractTaskDuration(task: Task): number {
  if (task.startTime && task.endTime) {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const start = parse(`${today} ${task.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const end = parse(`${today} ${task.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const diff = differenceInMinutes(end, start);
      if (diff > 0 && diff <= 360) return diff;
    } catch {}
  }

  const textToScan = `${task.text} ${task.subtask || ''}`;
  const hrMatch = textToScan.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)(?:\s|$)/i);
  if (hrMatch) {
    const hrs = parseFloat(hrMatch[1]);
    if (!isNaN(hrs) && hrs > 0) return Math.round(hrs * 60);
  }

  const minMatch = textToScan.match(/(?:^|\s)(\d+)\s*(?:m|min|mins|minute|minutes)(?:\s|$)/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (!isNaN(mins) && mins > 0) return mins;
  }

  return 25;
}

/**
 * Calculates current time-of-day category.
 */
export function getTimeOfDay(now: Date = new Date()): TimeOfDay {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculates the available time window before the next scheduled timetable event.
 */
export function calculateTimeWindow(timetable: TimetableBlock[] = [], now: Date = new Date()): TimeWindowInfo {
  const dayOfWeek = format(now, 'EEEE');
  const nowTimeStr = format(now, 'HH:mm');

  const todayBlocks = timetable
    .filter(b => b.day === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todayBlocks.length === 0) {
    return {
      type: 'no_events_today',
      currentBlock: null,
      nextBlock: null,
      availableMinutes: null,
      minutesUntilNext: null,
      summaryText: 'No scheduled timetable commitments today',
    };
  }

  const current = todayBlocks.find(b => b.startTime <= nowTimeStr && b.endTime > nowTimeStr) || null;
  if (current) {
    return {
      type: 'in_progress',
      currentBlock: current,
      nextBlock: todayBlocks.find(b => b.startTime >= current.endTime) || null,
      availableMinutes: 0,
      minutesUntilNext: 0,
      summaryText: `In session: ${current.subject} until ${current.endTime}`,
    };
  }

  const next = todayBlocks.find(b => b.startTime > nowTimeStr) || null;
  if (!next) {
    return {
      type: 'clear_rest_of_day',
      currentBlock: null,
      nextBlock: null,
      availableMinutes: null,
      minutesUntilNext: null,
      summaryText: 'Timetable commitments completed for today',
    };
  }

  try {
    const todayDateStr = format(now, 'yyyy-MM-dd');
    const nextStartDateTime = parse(`${todayDateStr} ${next.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const minutesRemaining = differenceInMinutes(nextStartDateTime, now);

    if (minutesRemaining <= 0) {
      return {
        type: 'in_progress',
        currentBlock: next,
        nextBlock: null,
        availableMinutes: 0,
        minutesUntilNext: 0,
        summaryText: `Starting now: ${next.subject}`,
      };
    }

    return {
      type: 'upcoming_window',
      currentBlock: null,
      nextBlock: next,
      availableMinutes: minutesRemaining,
      minutesUntilNext: minutesRemaining,
      summaryText: `${minutesRemaining}m window before ${next.subject} (${next.startTime})`,
    };
  } catch {
    return {
      type: 'clear_rest_of_day',
      currentBlock: null,
      nextBlock: null,
      availableMinutes: null,
      minutesUntilNext: null,
      summaryText: 'Timetable under control',
    };
  }
}

/**
 * Pure deterministic Daily Brief intelligence aggregator with Multi-Module synthesis.
 * Checks: Tasks, Timetable, Study, Gym Workout Plans/Logs, Shopping Lists, and Laundry.
 * Excludes Vault 100%.
 */
export function getDailyBriefData(data: AppData, now: Date = new Date()): DailyBriefData {
  const timeOfDay = getTimeOfDay(now);
  const todayStr = format(now, 'yyyy-MM-dd');
  const dayOfWeek = format(now, 'EEEE');
  const todayStart = startOfDay(now);
  const userName = getCachedUserName();

  const greetingPrefixes: Record<TimeOfDay, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  };

  const greeting = userName 
    ? `${greetingPrefixes[timeOfDay]}, ${userName}.`
    : `${greetingPrefixes[timeOfDay]}.`;

  const timeOfDayLabels: Record<TimeOfDay, string> = {
    morning: 'Morning Brief',
    afternoon: 'Afternoon Window',
    evening: 'Evening Wrap-Up',
    night: 'Night Summary',
  };

  // ── 1. Tasks Module ──
  const allTasks = data.tasks || [];
  const todayTasks = allTasks.filter(t => t.date === todayStr);
  const pendingTodayTasks = todayTasks.filter(t => !t.completed);
  const completedTodayTasks = todayTasks.filter(t => t.completed);

  const overdueTasks = allTasks.filter(t => {
    if (t.completed) return false;
    try {
      const taskDate = parse(t.date, 'yyyy-MM-dd', new Date());
      return isBefore(taskDate, todayStart);
    } catch {
      return false;
    }
  });

  // ── 2. Timetable Module ──
  const timeWindow = calculateTimeWindow(data.timetable || [], now);

  // ── 3. Study Module ──
  const todaySessions = (data.studySessions || []).filter(s => s.date === todayStr);
  const totalStudyMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyMins = totalStudyMinutes % 60;
  const studyFormatted = studyHours > 0 
    ? `${studyHours}h ${studyMins}m`
    : `${studyMins}m`;

  // Find most recent or primary subject
  let primaryStudySubject = 'Core Revision';
  if (todaySessions.length > 0 && todaySessions[0].subject) {
    primaryStudySubject = todaySessions[0].subject;
  } else if (data.studySessions && data.studySessions.length > 0) {
    primaryStudySubject = data.studySessions[data.studySessions.length - 1].subject || 'Core Revision';
  } else if (data.timetable && data.timetable.length > 0) {
    primaryStudySubject = data.timetable[0].subject || 'Core Revision';
  }

  // ── 4. Gym / Workout Module ──
  const dayMap: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  };
  const plannedWorkout = (data.workoutPlans || []).find(p => dayMap[p.day] === dayOfWeek || p.day === dayOfWeek);
  const todayWorkoutLog = (data.workoutLogs || []).find(w => w.date === todayStr);
  const isWorkoutDone = !!todayWorkoutLog;

  // ── 5. Shopping Module ──
  let totalPendingShoppingItems = 0;
  let primaryShoppingListName = 'Shopping List';
  if (data.shoppingLists && data.shoppingLists.length > 0) {
    for (const list of data.shoppingLists) {
      const unchecked = (list.items || []).filter(item => !item.checked).length;
      if (unchecked > 0) {
        totalPendingShoppingItems += unchecked;
        primaryShoppingListName = list.name || 'Shopping';
      }
    }
  }

  // ── 6. Laundry Module ──
  const activeLaundryBatch = (data.laundryBatches || []).find(b => b.status === 'submitted' || b.status === 'pending');

  // ── 7. Attention Analysis (Only if genuinely urgent) ──
  let attention: AttentionItem | null = null;
  if (timeWindow.type === 'upcoming_window' && timeWindow.minutesUntilNext !== null && timeWindow.minutesUntilNext <= 20) {
    attention = {
      id: 'imminent_class',
      text: `${timeWindow.nextBlock?.subject || 'Class'} starts in ${timeWindow.minutesUntilNext} minutes (${timeWindow.nextBlock?.startTime})`,
      severity: 'urgent',
      actionRoute: '/timetable',
    };
  } else if (overdueTasks.length > 0) {
    attention = {
      id: 'overdue_tasks',
      text: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} carried over from previous days`,
      severity: 'urgent',
      actionRoute: '/tasks',
    };
  } else if (activeLaundryBatch && activeLaundryBatch.status === 'submitted' && activeLaundryBatch.returnDate && activeLaundryBatch.returnDate <= todayStr) {
    attention = {
      id: 'laundry_due',
      text: 'Laundry batch expected for collection today',
      severity: 'info',
      actionRoute: '/laundry',
    };
  }

  const isAllClear = todayTasks.length > 0 && pendingTodayTasks.length === 0 && overdueTasks.length === 0;

  // ── 8. Intelligent Primary Recommendation Engine ──
  let recommendation: RecommendationInfo;

  if (pendingTodayTasks.length > 0 || overdueTasks.length > 0) {
    // ── CASE A: User has pending tasks ──
    const candidateTasks = [...overdueTasks, ...pendingTodayTasks];
    const availableMinutes = timeWindow.availableMinutes;

    let selectedTask: Task | null = null;
    let taskDuration = 25;
    let windowFitText = '';

    if (availableMinutes !== null && availableMinutes > 0) {
      const fittingTasks = candidateTasks
        .map(t => ({ task: t, duration: extractTaskDuration(t) }))
        .filter(item => item.duration <= availableMinutes)
        .sort((a, b) => b.duration - a.duration);

      if (fittingTasks.length > 0) {
        selectedTask = fittingTasks[0].task;
        taskDuration = fittingTasks[0].duration;
        windowFitText = `Fits your ${availableMinutes}m window`;
      }
    }

    if (!selectedTask) {
      selectedTask = overdueTasks[0] || pendingTodayTasks[0];
      taskDuration = extractTaskDuration(selectedTask);
      windowFitText = timeWindow.availableMinutes 
        ? `${taskDuration}m estimated` 
        : 'Priority focus';
    }

    const isOverdue = overdueTasks.some(t => t.id === selectedTask?.id);

    recommendation = {
      module: 'tasks',
      type: 'focus_task',
      badgeLabel: 'RECOMMENDED FOCUS',
      title: selectedTask.text,
      subtitle: selectedTask.subtask || (isOverdue ? 'Carried over from yesterday' : 'Next priority item'),
      metadata: `${taskDuration} min · ${windowFitText}${isOverdue ? ' · Overdue' : ''}`,
      durationMinutes: taskDuration,
      task: selectedTask,
      actionLabel: 'Start Focus',
      actionRoute: '/study/timer',
      actionContext: {
        taskName: selectedTask.text,
        duration: taskDuration,
      },
    };
  } else if (isAllClear) {
    // ── CASE B: All scheduled tasks completed ──
    recommendation = {
      module: 'tasks',
      type: 'all_clear',
      badgeLabel: 'ALL PLANNED WORK DONE',
      title: 'Planned tasks completed',
      subtitle: 'Everything scheduled for today is finished',
      metadata: `${completedTodayTasks.length} tasks accomplished · ${studyFormatted} focused`,
      durationMinutes: 0,
      actionLabel: timeOfDay === 'night' ? 'Plan Tomorrow' : 'Review Tasks',
      actionRoute: '/tasks',
    };
  } else {
    // ── CASE C: Zero tasks scheduled for today — SMART MULTI-MODULE SYNTHESIS ──
    // Instead of giving a blank "open schedule", synthesize Gym, Study, Shopping, or Tomorrow's Timetable!

    if (plannedWorkout && !isWorkoutDone && (timeOfDay === 'morning' || timeOfDay === 'afternoon' || timeOfDay === 'evening')) {
      // Recommend today's planned gym workout
      recommendation = {
        module: 'gym',
        type: 'workout',
        badgeLabel: "TODAY'S WORKOUT",
        title: `${plannedWorkout.type || 'Workout Routine'}`,
        subtitle: `${(plannedWorkout.exercises || []).length} exercises scheduled for ${dayOfWeek}`,
        metadata: `${dayOfWeek} Split · Gym & Recovery`,
        durationMinutes: 45,
        actionLabel: 'Start Workout',
        actionRoute: '/gym',
      };
    } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
      // Check tomorrow's timetable
      const tomorrowDate = addDays(now, 1);
      const tomorrowDay = format(tomorrowDate, 'EEEE');
      const tomorrowBlocks = (data.timetable || [])
        .filter(b => b.day === tomorrowDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (tomorrowBlocks.length > 0) {
        recommendation = {
          module: 'timetable',
          type: 'prepare_tomorrow',
          badgeLabel: "TOMORROW'S PREPARATION",
          title: `Prepare for ${tomorrowBlocks[0].subject}`,
          subtitle: `First session tomorrow starts at ${tomorrowBlocks[0].startTime}${tomorrowBlocks[0].room ? ` (Room ${tomorrowBlocks[0].room})` : ''}`,
          metadata: `${tomorrowBlocks.length} classes scheduled tomorrow · Timetable`,
          durationMinutes: 20,
          actionLabel: 'View Schedule',
          actionRoute: '/timetable',
        };
      } else {
        // Evening deep focus on core subject
        recommendation = {
          module: 'study',
          type: 'study_session',
          badgeLabel: 'DEEP FOCUS SESSION',
          title: `25m Focus: ${primaryStudySubject}`,
          subtitle: 'Build momentum and wrap up academic priorities',
          metadata: '25 min · Recommended Pomodoro session',
          durationMinutes: 25,
          actionLabel: 'Start Focus',
          actionRoute: '/study/timer',
          actionContext: {
            taskName: primaryStudySubject,
            duration: 25,
          },
        };
      }
    } else if (totalPendingShoppingItems > 0 && timeOfDay === 'afternoon') {
      // Recommend shopping list check
      recommendation = {
        module: 'shopping',
        type: 'shopping',
        badgeLabel: 'SHOPPING LIST',
        title: `${totalPendingShoppingItems} items pending on ${primaryShoppingListName}`,
        subtitle: 'Items ready to be purchased or checked off',
        metadata: `${totalPendingShoppingItems} items remaining · Personal`,
        durationMinutes: 15,
        actionLabel: 'Open List',
        actionRoute: '/shopping',
      };
    } else {
      // Default smart focus session
      recommendation = {
        module: 'study',
        type: 'study_session',
        badgeLabel: 'RECOMMENDED FOCUS',
        title: `25m Focus: ${primaryStudySubject}`,
        subtitle: 'Build study momentum on your primary subject',
        metadata: '25 min · Uninterrupted Pomodoro',
        durationMinutes: 25,
        actionLabel: 'Start Focus',
        actionRoute: '/study/timer',
        actionContext: {
          taskName: primaryStudySubject,
          duration: 25,
        },
      };
    }
  }

  // ── 9. Smart Multi-Module Suggestion Chips ──
  const smartSuggestions: SmartSuggestion[] = [];

  // Suggestion 1: Quick Focus Timer
  if (recommendation.type !== 'study_session') {
    smartSuggestions.push({
      id: 'focus_pomodoro',
      module: 'study',
      label: `25m Focus`,
      sublabel: primaryStudySubject,
      actionRoute: `/study/timer?subject=${encodeURIComponent(primaryStudySubject)}`,
    });
  }

  // Suggestion 2: Workout split
  if (plannedWorkout) {
    smartSuggestions.push({
      id: 'workout_chip',
      module: 'gym',
      label: isWorkoutDone ? 'Workout Done' : `${plannedWorkout.type}`,
      sublabel: isWorkoutDone ? 'Completed' : 'Planned Split',
      actionRoute: '/gym',
    });
  }

  // Suggestion 3: Shopping items
  if (totalPendingShoppingItems > 0 && recommendation.type !== 'shopping') {
    smartSuggestions.push({
      id: 'shopping_chip',
      module: 'shopping',
      label: `${totalPendingShoppingItems} Shopping Items`,
      sublabel: primaryShoppingListName,
      actionRoute: '/shopping',
    });
  }

  // Suggestion 4: Laundry
  if (activeLaundryBatch) {
    smartSuggestions.push({
      id: 'laundry_chip',
      module: 'laundry',
      label: activeLaundryBatch.status === 'submitted' ? 'Laundry Out' : 'Laundry Draft',
      sublabel: `${activeLaundryBatch.totalClothes} items`,
      actionRoute: '/laundry',
    });
  }

  // Suggestion 5: Add a new task
  smartSuggestions.push({
    id: 'add_task',
    module: 'tasks',
    label: 'Add Task',
    sublabel: 'Plan Priority',
    actionRoute: '/tasks',
  });

  // ── 10. Context Summary One-Liner ──
  let contextSummary = '';
  if (isAllClear) {
    contextSummary = "You're completely clear. All planned work for today is finished.";
  } else if (timeWindow.type === 'upcoming_window' && timeWindow.availableMinutes) {
    contextSummary = `${timeWindow.availableMinutes}m available before ${timeWindow.nextBlock?.subject || 'next session'} at ${timeWindow.nextBlock?.startTime}.`;
  } else if (timeWindow.type === 'in_progress') {
    contextSummary = `Currently in ${timeWindow.currentBlock?.subject} until ${timeWindow.currentBlock?.endTime}.`;
  } else if (pendingTodayTasks.length > 0 || overdueTasks.length > 0) {
    const totalPending = pendingTodayTasks.length + overdueTasks.length;
    contextSummary = `${totalPending} priority item${totalPending !== 1 ? 's' : ''} to accomplish today.`;
  } else if (plannedWorkout && !isWorkoutDone) {
    contextSummary = `${plannedWorkout.type} workout scheduled for ${dayOfWeek}. Schedule is open.`;
  } else {
    contextSummary = 'Schedule is open with no imminent timetable commitments.';
  }

  return {
    greeting,
    timeOfDay,
    timeOfDayLabel: timeOfDayLabels[timeOfDay],
    contextSummary,
    timeWindow,
    recommendation,
    smartSuggestions: smartSuggestions.slice(0, 4), // Top 3-4 suggestions
    attention,
    progressSummary: {
      completedCount: completedTodayTasks.length,
      totalCount: todayTasks.length,
      studyMinutes: totalStudyMinutes,
      studyFormatted,
      workoutDone: isWorkoutDone,
      workoutType: todayWorkoutLog?.type || plannedWorkout?.type,
      hasActivity: completedTodayTasks.length > 0 || totalStudyMinutes > 0 || isWorkoutDone,
    },
    isAllClear,
  };
}
