export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 37,
  versionName: '2.1.3',
  releaseDate: '2026-09-25',
  apkSize: '14.4 MB',
  apkSizeBytes: 14410000,
  releaseNotes: 'LifeOS v2.1.3 (Build 37):\n• Removed startup greeting screen for instant, frictionless app launching\n• Rebuilt M3 wavy progress indicator with hardware vector stenciling and smooth 4-quarter sine wave for butter-smooth 120 FPS downloads',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
