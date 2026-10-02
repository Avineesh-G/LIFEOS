export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 54,
  versionName: '3.1.0',
  releaseDate: '2026-10-02',
  apkSize: '14.5 MB',
  apkSizeBytes: 14500000,
  releaseNotes: 'LifeOS v3.1.0 (Build 54):\n• Material 3 Expressive Single Seed Color Engine (Burgundy Default + 6 Palettes)\n• Tonal surface elevation (zero blur overhead, instant performance)\n• Header Chat Icon (Pulse bubble) with container transform panel\n• M3 3-Slot bottom navigation + More orb\n• Frozen background layer manager on all popups & sheets',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
