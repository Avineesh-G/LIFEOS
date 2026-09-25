export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 35,
  versionName: '2.1.1',
  releaseDate: '2026-09-25',
  apkSize: '14.4 MB',
  apkSizeBytes: 14404380,
  releaseNotes: 'LifeOS v2.1.1 (Build 35):\n• High-Speed Direct In-App Downloader (no more stuck downloads over 5G/cellular data)\n• Real-time MB progress counter showing total update package size (14.4 MB)\n• Buttery-smooth 120 FPS GPU-accelerated M3 Expressive wavy progress bar\n• Fixed logout behavior: sign out preserves all user data and cloud sync cleanly',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
