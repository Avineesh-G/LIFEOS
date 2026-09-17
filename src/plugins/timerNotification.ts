import { registerPlugin } from '@capacitor/core';

export interface TimerNotificationPlugin {
  start(options: { label: string; elapsedBaseMs: number }): Promise<void>;
  pause(options: { label: string; elapsedBaseMs: number }): Promise<void>;
  resume(options: { label: string; elapsedBaseMs: number }): Promise<void>;
  stop(): Promise<void>;
  requestPermission(): Promise<{ granted: boolean }>;
}

export const TimerNotification = registerPlugin<TimerNotificationPlugin>('TimerNotification');
