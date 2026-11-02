export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 70,
  versionName: '3.3.3',
  releaseDate: '2026-11-02',
  apkSize: '8.93 MB',
  apkSizeBytes: 9365562,
  releaseNotes: "LifeOS v3.3.3 (Build 70):\n• November 2026 Mess Menu: Complete 30-day schedule with full Veg, Non-Veg, and Special Mess options\n• Nutrition Diary: Interactive 1-tap food logging with portion adjustment and accurate calorie tracking\n• Native Stability: Jitter-free navigation and 120 FPS fluid motion across all device views",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
