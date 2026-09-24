export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 29,
  versionName: '2.0.5',
  releaseDate: '2026-09-24',
  releaseNotes: 'LifeOS v2.0.5 (Build 29): Redesigned M3 Expressive update card & progress bar, rounded Material Symbols replacing emojis in Notes, and corrected header layout.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
