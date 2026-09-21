export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 16,
  versionName: '1.2.6',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.6 (Build 16): Updated navigation icons to Google Material Symbols (Rounded) for Home, Gym, Nutrition, Study, Spending, Shopping, Tasks, Laundry, and hub controls.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
