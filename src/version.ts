export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 30,
  versionName: '2.0.6',
  releaseDate: '2026-09-24',
  releaseNotes: 'LifeOS v2.0.6 (Build 30): Material 3 Expressive Daily Brief with smart multi-module suggestions, removed redundant quick actions & stat widgets, and clean home layout.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
