export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 27,
  versionName: '2.0.3',
  releaseDate: '2026-09-24',
  releaseNotes: 'LifeOS v2.0.3 (Build 27): Fix network status and offline indicator safe-area overlay clashing with camera cutout and hardware status bar.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
