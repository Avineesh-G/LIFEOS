export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 10,
  versionName: '1.2.3',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.3 (Build 10): Complete native UI/UX baseline, Outings interface, enhanced updater with SHA-256 validation, and universal screen layout engine.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
