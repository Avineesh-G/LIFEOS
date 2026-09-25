export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 36,
  versionName: '2.1.2',
  releaseDate: '2026-09-25',
  apkSize: '14.4 MB',
  apkSizeBytes: 14405000,
  releaseNotes: 'LifeOS v2.1.2 (Build 36):\n• Redesigned Sign Out confirmation modal to match the M3 To-Do list card dialog design\n• Fixed sign-out flow: logging out immediately displays the Google sign-in interface without looping back to the app\n• Preserved user data safely in cloud account on sign-out',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
