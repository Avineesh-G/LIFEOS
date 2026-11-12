export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 75,
  versionName: '3.3.8',
  releaseDate: '2026-11-12',
  apkSize: '10.20 MB',
  apkSizeBytes: 10695305,
  releaseNotes: "LifeOS v3.3.8 (Build 75):\n• Calendar Navigation & Status Bar Safe Clearance: Header lowered below status bars and punch-holes with back button navigation.\n• Zero Dock Collision: Enhanced bottom scroll padding and spacer so events and tasks sit cleanly above the floating navigation dock.\n• Liquid Droplet Architecture: Day drawer and calendar cells restyled into liquid glass droplets with specular micro-sheens.\n• Category Filter Layout: Horizontal scroll with zero text truncation for all event filters.\n• Clean Separation: Full Calendar moved to More Hub; Home calendar header launches floating quick agenda popup.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
