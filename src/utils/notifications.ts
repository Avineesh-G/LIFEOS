import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task, TimetableBlock } from '../types';

export const TIMETABLE_CHANNEL_ID = 'lifeos_timetable';
export const TASKS_CHANNEL_ID = 'lifeos_tasks';
export const NUTRITION_CHANNEL_ID = 'lifeos_nutrition';
export const STUDY_CHANNEL_ID = 'lifeos_study';

export const NOTIFICATION_ICON = 'ic_stat_lifeos';
export const NOTIFICATION_COLOR = '#6366F1';
export const STUDY_TIMER_NOTIF_ID = 88888;

let channelCreated = false;

async function ensureNotificationChannels() {
  if (channelCreated || !Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: TIMETABLE_CHANNEL_ID,
      name: 'Timetable Reminders',
      description: 'Alerts before upcoming classes and lectures',
      importance: 5, // High/Max importance -> heads-up banner & stays in notification center
      visibility: 1, // Public visibility on lockscreen and shade
      vibration: true,
      lights: true,
      lightColor: '#0891B2',
    });

    await LocalNotifications.createChannel({
      id: TASKS_CHANNEL_ID,
      name: 'To-Do & Tasks Reminders',
      description: 'Reminders for scheduled tasks and deadlines',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#10B981',
    });

    await LocalNotifications.createChannel({
      id: NUTRITION_CHANNEL_ID,
      name: 'Nutrition & Meal Alerts',
      description: 'Daily breakfast, lunch, snacks, and dinner mess reminders',
      importance: 5, // High/Max importance for heads-up alert
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#F59E0B',
    });

    await LocalNotifications.createChannel({
      id: STUDY_CHANNEL_ID,
      name: 'Active Study Timer',
      description: 'Ongoing status bar notification showing live study session timer',
      importance: 3, // Low sound to avoid chiming on status updates
      visibility: 1,
      vibration: false,
      lights: false,
      lightColor: '#6366F1',
    });

    channelCreated = true;
  } catch (err) {
    console.warn('[Notifications] Failed to create channels:', err);
  }
}

let permissionRequestInFlight: Promise<boolean> | null = null;

/**
 * Requests permission directly from the phone operating system to show notifications in the phone notification center.
 * Features strict singleton deduplication so the user is never prompted multiple times on launch.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // 1. If already granted, return true immediately without triggering any native OS dialog
    const alreadyGranted = await checkNotificationPermission();
    if (alreadyGranted) return true;

    // 2. If a prompt is already in-flight across components, return the existing promise
    if (permissionRequestInFlight) {
      return permissionRequestInFlight;
    }

    permissionRequestInFlight = (async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await ensureNotificationChannels();
          // Explicitly request display permission only so Android never kicks user to "Alarms & Reminders"
          const status = await (LocalNotifications as any).requestPermissions({ permissions: ['display'] });
          return status.display === 'granted';
        } else if (typeof window !== 'undefined' && 'Notification' in window) {
          const res = await Notification.requestPermission();
          return res === 'granted';
        }
      } catch (err) {
        console.warn('[Notifications] requestPermission error:', err);
      } finally {
        permissionRequestInFlight = null;
      }
      return false;
    })();

    return await permissionRequestInFlight;
  } catch (err) {
    console.warn('[Notifications] requestPermission error:', err);
  }
  return false;
}

/**
 * Requests system permission from the phone OS, and if granted, immediately syncs timetable & task alerts
 * and sends an instant confirmation alert directly into the phone's notification center.
 */
export async function requestAndSyncNotifications(
  data?: any,
  updateData?: (partial: any) => Promise<any>
): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (granted) {
    if (updateData && data) {
      try {
        await updateData({
          settings: {
            ...data.settings,
            notificationsEnabled: true,
            timetableNotificationsEnabled: true,
            taskNotificationsEnabled: true,
            nutritionNotificationsEnabled: true,
          },
        });
      } catch (e) {
        console.warn('[Notifications] Failed to update settings:', e);
      }
    }

    // Schedule in non-blocking background queue
    setTimeout(() => {
      if (data?.timetable) {
        syncTimetableNotifications(data.timetable, data.settings?.notificationLeadMinutes || 10);
      }
      if (data?.tasks) {
        syncTaskNotifications(data.tasks, data.settings?.notificationLeadMinutes || 10);
      }
      syncNutritionNotifications();
    }, 50);

    // Fire instant alert with app logo into the actual phone notification center ONCE on first grant
    if (!localStorage.getItem('lifeos_initial_test_notif_sent')) {
      localStorage.setItem('lifeos_initial_test_notif_sent', 'true');
      await sendInstantTestNotification(
        'LifeOS Notifications Active',
        'Timetable, TO-DO, Nutrition alerts, and Study timer will appear here with the LifeOS logo.'
      );
    }
    return true;
  }
  return false;
}

/**
 * Checks if notification permission is currently granted.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
  } catch (err) {
    console.warn('[Notifications] checkPermission error:', err);
  }
  return false;
}

/**
 * Helper to generate a 32-bit positive integer ID for Capacitor notifications
 */
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 2147483647);
}

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Schedules timetable class alerts in the Android Notification Center:
 * 1) Exactly 20 minutes before class starts (pre-event alert)
 * 2) Exactly 1 minute after class starts (start confirmation alert)
 * Uses exact RTC_WAKEUP alarms (setExactAndAllowWhileIdle) with wakeful lock to prevent delays.
 */
export async function syncTimetableNotifications(
  blocks: TimetableBlock[],
  _leadMinutes?: number
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return 0;

  await ensureNotificationChannels();

  try {
    const pending = await LocalNotifications.getPending();
    const timetableNotifications = pending.notifications.filter(n =>
      n.extra?.type === 'timetable'
    );
    if (timetableNotifications.length > 0) {
      await LocalNotifications.cancel({ notifications: timetableNotifications });
    }

    const now = new Date();
    const currentDay = now.getDay();
    const notificationsToSchedule: any[] = [];

    // Schedule for next 14 days
    for (const block of blocks) {
      if (!block.startTime || !block.day) continue;
      const targetDay = DAY_MAP[block.day];
      if (targetDay === undefined) continue;

      const [hours, minutes] = block.startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) continue;

      let dayDiff = targetDay - currentDay;
      if (dayDiff < 0) dayDiff += 7;

      for (let week = 0; week < 2; week++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(now.getDate() + dayDiff + week * 7);
        scheduledTime.setHours(hours, minutes, 0, 0);

        const dateKey = scheduledTime.toISOString().slice(0, 10);

        // ── 1. Alert exactly 20 minutes BEFORE event starts ──
        const preTriggerTime = new Date(scheduledTime.getTime() - 20 * 60 * 1000);
        if (preTriggerTime.getTime() > now.getTime() + 15 * 1000) {
          const preNotifId = hashStringToInt(`tt_pre20_${block.id}_${dateKey}`);
          let bodyText = `Class starts in 20m at ${block.startTime}`;
          if (block.room) bodyText += ` • Room ${block.room}`;
          if (block.teacher) bodyText += ` • ${block.teacher}`;

          notificationsToSchedule.push({
            id: preNotifId,
            title: `Upcoming in 20m: ${block.subject || 'Class'}`,
            body: bodyText,
            channelId: TIMETABLE_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: NOTIFICATION_COLOR,
            isExactNotification: true,
            schedule: { at: preTriggerTime, allowWhileIdle: true },
            extra: {
              type: 'timetable',
              phase: 'pre20',
              blockId: block.id,
              subject: block.subject,
            },
          });
        }

        // ── 2. Alert exactly 1 minute AFTER event starts ──
        const postTriggerTime = new Date(scheduledTime.getTime() + 1 * 60 * 1000);
        if (postTriggerTime.getTime() > now.getTime() + 15 * 1000) {
          const postNotifId = hashStringToInt(`tt_post1_${block.id}_${dateKey}`);
          let bodyText = `Class started at ${block.startTime} (1m ago)`;
          if (block.room) bodyText += ` • Room ${block.room}`;
          if (block.teacher) bodyText += ` • ${block.teacher}`;

          notificationsToSchedule.push({
            id: postNotifId,
            title: `Started: ${block.subject || 'Class'}`,
            body: bodyText,
            channelId: TIMETABLE_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: NOTIFICATION_COLOR,
            isExactNotification: true,
            schedule: { at: postTriggerTime, allowWhileIdle: true },
            extra: {
              type: 'timetable',
              phase: 'post1',
              blockId: block.id,
              subject: block.subject,
            },
          });
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 64);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing timetable notifications:', err);
  }
  return 0;
}

/**
 * Schedules reminders for pending tasks:
 * 1) Exactly 20 minutes before scheduled start time
 * 2) Exactly 1 minute after scheduled start time
 * Uses exact RTC_WAKEUP alarms (setExactAndAllowWhileIdle) with wakeful lock to prevent delays.
 */
export async function syncTaskNotifications(
  tasks: Task[],
  _leadMinutes?: number
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return 0;

  await ensureNotificationChannels();

  try {
    const pending = await LocalNotifications.getPending();
    const taskNotifications = pending.notifications.filter(n =>
      n.extra?.type === 'task'
    );
    if (taskNotifications.length > 0) {
      await LocalNotifications.cancel({ notifications: taskNotifications });
    }

    const now = new Date();
    const notificationsToSchedule: any[] = [];

    for (const task of tasks) {
      if (task.completed) continue;
      const targetDateStr = task.dueDate || task.date;
      const targetTimeStr = task.startTime || task.reminderTime;
      if (!targetDateStr || !targetTimeStr) continue;

      const [year, month, day] = targetDateStr.split('-').map(Number);
      const [hours, minutes] = targetTimeStr.split(':').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) continue;

      const taskDateTime = new Date(year, month - 1, day, hours, minutes, 0);

      // ── 1. Alert exactly 20 minutes BEFORE task starts ──
      const preTriggerTime = new Date(taskDateTime.getTime() - 20 * 60 * 1000);
      if (preTriggerTime.getTime() > now.getTime() + 15 * 1000) {
        const preNotifId = hashStringToInt(`task_pre20_${task.id}_${taskDateTime.getTime()}`);
        let bodyText = `Starts in 20m at ${targetTimeStr}`;
        if (task.subtask) bodyText += ` • ${task.subtask}`;
        if (task.endTime) bodyText += ` (until ${task.endTime})`;

        notificationsToSchedule.push({
          id: preNotifId,
          title: `Task in 20m: ${task.text}`,
          body: bodyText,
          channelId: TASKS_CHANNEL_ID,
          smallIcon: NOTIFICATION_ICON,
          iconColor: '#10B981',
          isExactNotification: true,
          schedule: { at: preTriggerTime, allowWhileIdle: true },
          extra: {
            type: 'task',
            phase: 'pre20',
            taskId: task.id,
          },
        });
      }

      // ── 2. Alert exactly 1 minute AFTER task starts ──
      const postTriggerTime = new Date(taskDateTime.getTime() + 1 * 60 * 1000);
      if (postTriggerTime.getTime() > now.getTime() + 15 * 1000) {
        const postNotifId = hashStringToInt(`task_post1_${task.id}_${taskDateTime.getTime()}`);
        let bodyText = `Scheduled start was ${targetTimeStr} (1m ago)`;
        if (task.subtask) bodyText += ` • ${task.subtask}`;

        notificationsToSchedule.push({
          id: postNotifId,
          title: `Task Started: ${task.text}`,
          body: bodyText,
          channelId: TASKS_CHANNEL_ID,
          smallIcon: NOTIFICATION_ICON,
          iconColor: '#10B981',
          isExactNotification: true,
          schedule: { at: postTriggerTime, allowWhileIdle: true },
          extra: {
            type: 'task',
            phase: 'post1',
            taskId: task.id,
          },
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 64);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing task notifications:', err);
  }
  return 0;
}

/**
 * Schedules daily Nutrition and Mess meal reminders (Breakfast, Lunch, Snacks, Dinner):
 * 1) Exactly 20 minutes before meal serving starts
 * 2) Exactly 1 minute after meal serving starts
 * Uses exact RTC_WAKEUP alarms (setExactAndAllowWhileIdle) with wakeful lock to prevent delays.
 */
export async function syncNutritionNotifications(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return 0;

  await ensureNotificationChannels();

  try {
    const pending = await LocalNotifications.getPending();
    const nutritionNotifications = pending.notifications.filter(n =>
      n.extra?.type === 'nutrition'
    );
    if (nutritionNotifications.length > 0) {
      await LocalNotifications.cancel({ notifications: nutritionNotifications });
    }

    // Official mess meal timings
    const MEAL_TIMES = [
      { slot: 'breakfast', hour: 7,  minute: 30, title: 'Breakfast', startTimeStr: '7:30 AM',  windowStr: '7:30–9:45 AM' },
      { slot: 'lunch',     hour: 12, minute: 15, title: 'Lunch',     startTimeStr: '12:15 PM', windowStr: '12:15–2:45 PM' },
      { slot: 'snacks',    hour: 16, minute: 15, title: 'Snacks',    startTimeStr: '4:15 PM',  windowStr: '4:15–6:15 PM' },
      { slot: 'dinner',    hour: 19, minute: 15, title: 'Dinner',    startTimeStr: '7:15 PM',  windowStr: '7:15–9:30 PM' },
    ];

    const now = new Date();
    const notificationsToSchedule: any[] = [];

    // Schedule for next 5 days
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      for (const meal of MEAL_TIMES) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(now.getDate() + dayOffset);
        scheduledTime.setHours(meal.hour, meal.minute, 0, 0);

        const dateKey = scheduledTime.toISOString().slice(0, 10);

        // ── 1. Alert exactly 20 minutes BEFORE meal starts ──
        const preTriggerTime = new Date(scheduledTime.getTime() - 20 * 60 * 1000);
        if (preTriggerTime.getTime() > now.getTime() + 15 * 1000) {
          const preNotifId = hashStringToInt(`nutri_pre20_${meal.slot}_${dateKey}`);
          notificationsToSchedule.push({
            id: preNotifId,
            title: `${meal.title} in 20m`,
            body: `Mess ${meal.slot} starts at ${meal.startTimeStr} (${meal.windowStr}). Fuel your day!`,
            channelId: NUTRITION_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: '#F59E0B',
            isExactNotification: true,
            schedule: { at: preTriggerTime, allowWhileIdle: true },
            extra: {
              type: 'nutrition',
              phase: 'pre20',
              slot: meal.slot,
            },
          });
        }

        // ── 2. Alert exactly 1 minute AFTER meal starts ──
        const postTriggerTime = new Date(scheduledTime.getTime() + 1 * 60 * 1000);
        if (postTriggerTime.getTime() > now.getTime() + 15 * 1000) {
          const postNotifId = hashStringToInt(`nutri_post1_${meal.slot}_${dateKey}`);
          notificationsToSchedule.push({
            id: postNotifId,
            title: `${meal.title} is Active`,
            body: `Mess ${meal.slot} is serving now (${meal.windowStr}). Don't skip your nutrition!`,
            channelId: NUTRITION_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: '#F59E0B',
            isExactNotification: true,
            schedule: { at: postTriggerTime, allowWhileIdle: true },
            extra: {
              type: 'nutrition',
              phase: 'post1',
              slot: meal.slot,
            },
          });
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 40);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing nutrition notifications:', err);
  }
  return 0;
}

/**
 * Unified master synchronization of all scheduled local notifications:
 * Synchronizes Timetable, Tasks, and Nutrition reminders with dual exact alarms:
 * - 20 minutes before event start
 * - 1 minute after event start
 */
export async function syncAllNotifications(data?: any): Promise<{
  timetableCount: number;
  taskCount: number;
  nutritionCount: number;
}> {
  if (!Capacitor.isNativePlatform() || !data) {
    return { timetableCount: 0, taskCount: 0, nutritionCount: 0 };
  }

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    return { timetableCount: 0, taskCount: 0, nutritionCount: 0 };
  }

  const timetableCount = data.timetable ? await syncTimetableNotifications(data.timetable) : 0;
  const taskCount = data.tasks ? await syncTaskNotifications(data.tasks) : 0;
  const nutritionCount = await syncNutritionNotifications();

  return { timetableCount, taskCount, nutritionCount };
}

/**
 * Checks whether the app can schedule exact alarms on Android 12+.
 */
export async function checkExactAlarmPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    if (typeof (LocalNotifications as any).checkExactNotificationSetting === 'function') {
      const res = await (LocalNotifications as any).checkExactNotificationSetting();
      return res?.exact_alarm === 'granted';
    }
  } catch {}
  return true;
}

/**
 * Displays or updates a live, ongoing study timer notification in the phone's notification bar.
 */
export async function showStudyTimerNotification(
  subject: string,
  seconds: number,
  topic?: string,
  isPaused: boolean = false
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await ensureNotificationChannels();
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const title = isPaused ? `Study Paused: ${subject}` : `Deep Work: ${subject}`;
    const body = `Focus Time: ${timeStr}${topic ? ` • ${topic}` : ''}`;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: STUDY_TIMER_NOTIF_ID,
          title,
          body,
          channelId: STUDY_CHANNEL_ID,
          ongoing: !isPaused,
          autoCancel: false,
          smallIcon: NOTIFICATION_ICON,
          iconColor: NOTIFICATION_COLOR,
          schedule: { at: new Date(Date.now() + 50) },
          extra: {
            type: 'study_timer',
            subject,
          },
        },
      ],
    });
  } catch (err) {
    console.warn('[Notifications] Failed to show study timer notification:', err);
  }
}

/**
 * Cancels the ongoing study timer notification once a session completes or stops.
 */
export async function cancelStudyTimerNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: STUDY_TIMER_NOTIF_ID }],
    });
  } catch (err) {
    console.warn('[Notifications] Failed to cancel study timer notification:', err);
  }
}

/**
 * Fires an immediate confirmation notification to the device notification center with the LifeOS logo.
 * Instant dispatch without artificial delays.
 */
export async function sendInstantTestNotification(title: string, body: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await ensureNotificationChannels();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 1000000) + 1,
          title,
          body,
          channelId: TASKS_CHANNEL_ID,
          smallIcon: NOTIFICATION_ICON,
          iconColor: NOTIFICATION_COLOR,
          schedule: { at: new Date(Date.now() + 50), allowWhileIdle: true },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('[Notifications] Instant notification failed:', err);
    return false;
  }
}

/**
 * Fires an instant native phone notification when a new LifeOS update is available.
 * Appears in the Android notification bar/shade immediately.
 */
export async function sendUpdateAvailableNotification(
  currentVersion: string,
  newVersion: string,
  releaseNotes?: string
): Promise<boolean> {
  const body = releaseNotes
    ? releaseNotes.slice(0, 140) + (releaseNotes.length > 140 ? '...' : '')
    : `Open LifeOS to download v${newVersion} now.`;

  if (Capacitor.isNativePlatform()) {
    try {
      const hasPerm = await checkNotificationPermission();
      if (!hasPerm) {
        await requestNotificationPermission();
      }
      await ensureNotificationChannels();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99999,
            title: `LifeOS Update Available — v${newVersion}`,
            body,
            channelId: TASKS_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: NOTIFICATION_COLOR,
            schedule: { at: new Date(Date.now() + 50), allowWhileIdle: true },
            extra: {
              type: 'update_available',
              currentVersion,
              newVersion,
            },
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('[Notifications] Native update notification failed:', err);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`LifeOS Update Available — v${newVersion}`, {
        body,
        icon: '/pwa-192x192.png',
      });
      return true;
    } catch (e) {
      console.warn('[Notifications] Web update notification failed:', e);
    }
  }
  return false;
}
