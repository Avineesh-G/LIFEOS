export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 17,
  versionName: '1.2.7',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.7 (Build 17): Added 15 new curated tonal color families (25 total) to the per-interface personalization system with 1-to-1 lock enforcement and live preview.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
