export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 28,
  versionName: '2.0.4',
  releaseDate: '2026-09-24',
  releaseNotes: 'LifeOS v2.0.4 (Build 28): Categorized navigation hub with settings at end, navbar color matching across all sections, notes prompt templates, and header cloud/offline status indicator.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
