export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 26,
  versionName: '2.0.2',
  releaseDate: '2026-09-24',
  releaseNotes: 'LifeOS v2.0.2 (Build 26): 100% offline launch with zero net::ERR_NAME_NOT_RESOLVED errors, native WebView auto-healing, Android Hardware Back Navigation, Edge-to-Edge Immersive Theming, Launcher Shortcuts, and WorkManager Background Sync.',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
