export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 13,
  versionName: '1.2.3',
  releaseDate: '2026-09-21',
  releaseNotes: 'LifeOS v1.2.3 (Build 13): Settings sections enclosed by default with quick enlarge/enclose controls, modal layout refinements, and zero-overlap smooth scrolling.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
