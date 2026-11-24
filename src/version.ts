export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 87,
  versionName: '3.4.10',
  releaseDate: '2026-11-24',
  apkSize: '15.04 MB',
  apkSizeBytes: 15767509,
  releaseNotes: "LifeOS v3.4.10 (Build 87):\n• Complete Laundry Notification System: Automated dhobi dispatch alerts, twice-daily pickup check reminders (11:30 AM & 5:30 PM), and fresh fits received confirmations.\n• Direct Interface Deep-Linking: Tapping any notification opens directly into that specific module interface (Laundry, Timetable, Tasks, Nutrition, Gym, Calendar).\n• Multi-Interface Test Alert Suite: Trigger all app interface notifications with a single click in Settings with a 20-second anti-spam cooldown timer.\n• Redesigned Money Lent & Borrowed Hero Card: Unified high-tier architecture with Overall Net Position headline, visual dual-tone flow ratio bar, and integrated To Receive vs To Pay metrics.\n• 120Hz Liquid Droplet Navigation: Synchronous 0ms tab transitions with Apple Liquid Glass squash-and-stretch kinematics and meniscus refraction.\n• Nutrition Calorie Viewport Clearance: Dynamic sheet height with generous scroll padding and unclipped AI calorie calculation indicators.\n• Centered Luna Chatbot UI: Centered Luna hero with dockable quick prompt starters that auto-hide while typing.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
