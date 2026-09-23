export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 24,
  versionName: '2.0.0',
  releaseDate: '2026-09-23',
  releaseNotes: 'LifeOS v2.0.0 (Build 24): 100% offline launch, in-app offline notification modal, draft auto-preservation across interfaces, and auto-healing cloud sync with opted signs preservation.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
