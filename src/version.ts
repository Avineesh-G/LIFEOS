export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 12,
  versionName: '1.2.3',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.3 (Build 12): Fixed Outing Expenses bottom sheet touch-scroll capture and added sticky accessible action buttons across all modal sheets.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
