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
      importance: 4,
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
 * Schedules timetable class alerts in the Android Notification Center.
 */
export async function syncTimetableNotifications(
  blocks: TimetableBlock[],
  leadMinutes: number = 10
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

        // Subtract lead minutes
        const triggerTime = new Date(scheduledTime.getTime() - leadMinutes * 60 * 1000);

        // Only schedule if it's at least 30 seconds in the future
        if (triggerTime.getTime() > now.getTime() + 30 * 1000) {
          const notifId = hashStringToInt(`tt_${block.id}_${triggerTime.toISOString().slice(0, 10)}`);
          
          let bodyText = `Class starts in ${leadMinutes}m at ${block.startTime}`;
          if (block.room) bodyText += ` • Room ${block.room}`;
          if (block.teacher) bodyText += ` • ${block.teacher}`;

          notificationsToSchedule.push({
            id: notifId,
            title: `${block.subject || 'Class'} Reminder`,
            body: bodyText,
            channelId: TIMETABLE_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: NOTIFICATION_COLOR,
            isExactNotification: false,
            schedule: { at: triggerTime, allowWhileIdle: true },
            extra: {
              type: 'timetable',
              blockId: block.id,
              subject: block.subject,
            },
          });
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 35);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing timetable notifications:', err);
  }
  return 0;
}

/**
 * Schedules reminders for pending tasks that have dueDate and startTime/reminderTime.
 */
export async function syncTaskNotifications(
  tasks: Task[],
  leadMinutes: number = 10
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
      const triggerTime = new Date(taskDateTime.getTime() - leadMinutes * 60 * 1000);

      if (triggerTime.getTime() > now.getTime() + 30 * 1000) {
        const notifId = hashStringToInt(`task_${task.id}_${triggerTime.getTime()}`);
        
        let bodyText = task.subtask ? `${task.subtask} • ` : '';
        bodyText += `Starts at ${targetTimeStr}`;
        if (task.endTime) bodyText += ` until ${task.endTime}`;

        notificationsToSchedule.push({
          id: notifId,
          title: `Task Reminder: ${task.text}`,
          body: bodyText,
          channelId: TASKS_CHANNEL_ID,
          smallIcon: NOTIFICATION_ICON,
          iconColor: '#10B981',
          isExactNotification: false,
          schedule: { at: triggerTime, allowWhileIdle: true },
          extra: {
            type: 'task',
            taskId: task.id,
          },
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 35);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing task notifications:', err);
  }
  return 0;
}

/**
 * Schedules daily Nutrition and Mess meal reminders (Breakfast, Lunch, Snacks, Dinner).
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

    const MEAL_TIMES = [
      { slot: 'breakfast', hour: 8,  minute: 0,  title: 'Breakfast Time', body: 'Mess breakfast is serving (7:30–9:45 AM). Fuel your day!' },
      { slot: 'lunch',     hour: 13, minute: 0,  title: 'Lunch Time',     body: 'Mess lunch is active (12:15–2:45 PM). Don\'t skip your nutrition!' },
      { slot: 'snacks',    hour: 17, minute: 0,  title: 'Evening Snacks', body: 'Evening snacks are ready (4:15–6:15 PM). Grab a healthy bite!' },
      { slot: 'dinner',    hour: 20, minute: 0,  title: 'Dinner Time',    body: 'Mess dinner is open (7:15–9:30 PM). Hit your protein and calorie targets!' },
    ];

    const now = new Date();
    const notificationsToSchedule: any[] = [];

    // Schedule for next 5 days
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      for (const meal of MEAL_TIMES) {
        const triggerTime = new Date(now);
        triggerTime.setDate(now.getDate() + dayOffset);
        triggerTime.setHours(meal.hour, meal.minute, 0, 0);

        if (triggerTime.getTime() > now.getTime() + 60 * 1000) {
          const notifId = hashStringToInt(`nutri_${meal.slot}_${triggerTime.toISOString().slice(0, 10)}`);
          notificationsToSchedule.push({
            id: notifId,
            title: meal.title,
            body: meal.body,
            channelId: NUTRITION_CHANNEL_ID,
            smallIcon: NOTIFICATION_ICON,
            iconColor: '#F59E0B',
            isExactNotification: false,
            schedule: { at: triggerTime, allowWhileIdle: true },
            extra: {
              type: 'nutrition',
              slot: meal.slot,
            },
          });
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 20);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing nutrition notifications:', err);
  }
  return 0;
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
