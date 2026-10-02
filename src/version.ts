export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 50,
  versionName: '3.0.0',
  releaseDate: '2026-10-02',
  apkSize: '13.8 MB',
  apkSizeBytes: 14424159,
  releaseNotes: 'LifeOS v3.0.0 (Build 1):\n• Elevated floating navigation dock with frosted glass atmosphere\n• Centered pop-up interfaces with body gesture lock\n• Document-root portal rendering for full device compatibility',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
