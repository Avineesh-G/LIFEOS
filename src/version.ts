export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 38,
  versionName: '2.1.4',
  releaseDate: '2026-10-01',
  apkSize: '14.4 MB',
  apkSizeBytes: 14410000,
  releaseNotes: 'LifeOS v2.1.4 (Build 38):\n• Updated VIT-AP Mess Menu for October 2026 with full date-by-date calendar integration\n• Enhanced nutrition protocol tracking and item diet indicators',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
