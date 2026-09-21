export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 11,
  versionName: '1.2.3',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.3 (Build 11): Fixed vertical scrolling regression, guaranteed single viewport scroller architecture, and added comprehensive touch regression test matrix.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
