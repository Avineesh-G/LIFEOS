export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 25,
  versionName: '2.0.1',
  releaseDate: '2026-09-23',
  releaseNotes: 'LifeOS v2.0.1 (Build 25): 100% offline launch, one-time cloud data migration prompt, and complete data reset engine.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
