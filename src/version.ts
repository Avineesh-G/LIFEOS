export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 39,
  versionName: '2.1.5',
  releaseDate: '2026-10-01',
  apkSize: '14.5 MB',
  apkSizeBytes: 14500000,
  releaseNotes: 'LifeOS v2.1.5 (Build 39):\n• Ask LifeOS AI Privacy Controls & Data Access Layer\n• Automatic sensitive data redaction, prompt injection defense, 90-day local usage history',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
