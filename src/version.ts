export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 14,
  versionName: '1.2.4',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.4 (Build 14): Scalloped navigation shapes — active icon indicator and More button now use a 12-lobed organic scallop shape with per-interface color sync and spin animation on tab switch.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
