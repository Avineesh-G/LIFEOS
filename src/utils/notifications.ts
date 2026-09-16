import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task, TimetableBlock } from '../types';

export const TIMETABLE_CHANNEL_ID = 'lifeos_timetable';
export const TASKS_CHANNEL_ID = 'lifeos_tasks';

let channelCreated = false;

async function ensureNotificationChannels() {
  if (channelCreated || !Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: TIMETABLE_CHANNEL_ID,
      name: 'Timetable Reminders',
      description: 'Alerts before upcoming classes and lectures',
      importance: 4, // High importance -> shows heads-up & notification shade
      visibility: 1, // Public
      vibration: true,
      sound: undefined,
    });

    await LocalNotifications.createChannel({
      id: TASKS_CHANNEL_ID,
      name: 'To-Do & Tasks Reminders',
      description: 'Reminders for scheduled tasks and deadlines',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: undefined,
    });
    channelCreated = true;
  } catch (err) {
    console.warn('[Notifications] Failed to create channels:', err);
  }
}

/**
 * Requests permission to show notifications in the mobile notification center.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await ensureNotificationChannels();
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
  } catch (err) {
    console.warn('[Notifications] requestPermission error:', err);
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

    // Schedule for next 7 days
    for (const block of blocks) {
      if (!block.startTime || !block.day) continue;
      const targetDay = DAY_MAP[block.day];
      if (targetDay === undefined) continue;

      const [hours, minutes] = block.startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) continue;

      // Calculate days ahead (0 to 6)
      let dayDiff = targetDay - currentDay;
      if (dayDiff < 0) dayDiff += 7;

      for (let week = 0; week < 2; week++) { // Next 14 days
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
            title: `📚 ${block.subject || 'Class'} Reminder`,
            body: bodyText,
            channelId: TIMETABLE_CHANNEL_ID,
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
      // Limit to 40 notifications to preserve OS limits
      const capped = notificationsToSchedule.slice(0, 40);
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
          title: `✅ Task Reminder: ${task.text}`,
          body: bodyText,
          channelId: TASKS_CHANNEL_ID,
          schedule: { at: triggerTime, allowWhileIdle: true },
          extra: {
            type: 'task',
            taskId: task.id,
          },
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      const capped = notificationsToSchedule.slice(0, 40);
      await LocalNotifications.schedule({ notifications: capped });
      return capped.length;
    }
  } catch (err) {
    console.warn('[Notifications] Error syncing task notifications:', err);
  }
  return 0;
}

/**
 * Fires an immediate confirmation notification to the device notification center.
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
          schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('[Notifications] Instant notification failed:', err);
    return false;
  }
}
