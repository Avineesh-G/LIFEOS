export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 15,
  versionName: '1.2.5',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.5 (Build 15): Complete Night Canteen menu with all 91 finalized items, dietary/category filters, real-time search, calorie tracking, and automatic canteen billing.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
