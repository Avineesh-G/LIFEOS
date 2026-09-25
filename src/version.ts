export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 34,
  versionName: '2.1.0',
  releaseDate: '2026-09-25',
  releaseNotes: 'LifeOS v2.1.0 (Build 34):\n• Fixed logout behavior: signing out no longer prompts with data loss warnings or resets data\n• Clean and instant Sign Out flow keeping all user records and cloud sync safely intact\n• Dedicated Reset Data option remains the sole destructive action for complete data wiping',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
