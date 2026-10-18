export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 64,
  versionName: '3.2.7',
  releaseDate: '2026-10-18',
  apkSize: '8.78 MB',
  apkSizeBytes: 9204884,
  releaseNotes: 'LifeOS v3.2.7 (Build 64):\n• AI Nutrition Auto-Calorie & Portion Logging: Users only specify what & how much they ate — AI automatically calculates and applies exact calories\n• 150+ Verified Indian & Student Dishes Database: Instant 0ms offline calorie estimation for standard mess meals, gym food, and street snacks\n• Multi-Item Meal Detection: Intelligently identifies composite meals (e.g. "2 rotis and 1 bowl dal") and logs each item with precise calories\n• Real-Time Macro Breakdown: Displays estimated protein, carbs, and fats per serving and auto-scales with interactive portion steppers',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
