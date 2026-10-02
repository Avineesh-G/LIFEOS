export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 53,
  versionName: '3.0.0',
  releaseDate: '2026-10-02',
  apkSize: '14.5 MB',
  apkSizeBytes: 14500000,
  releaseNotes: 'LifeOS v3.0.0 (Build 53):\n• Fix Ask LifeOS Groq model retirement with dynamic gpt-oss runtime resolution\n• Support reasoning stream parsing and retry for empty answers\n• Added AI connection tester, build badge, and settings reset in Settings > AI',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
