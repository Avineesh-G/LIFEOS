export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 72,
  versionName: '3.3.5',
  releaseDate: '2026-11-05',
  apkSize: '10.19 MB',
  apkSizeBytes: 10681651,
  releaseNotes: "LifeOS v3.3.5 (Build 72):\n• LifeOS Drive & Docs Hub: 5.0 GB local-first cloud storage with high-speed multi-file uploads and instant cross-device QR code transfer\n• In-Reader AI Document Inspector: Extracts and auto-routes document receipts, workouts, meals, notes, and tasks directly to LifeOS hubs\n• Edge-to-Edge Android Layout: Refined status bar clearance, zero header overshadowing, and pinned ergonomic mobile action bars\n• Enhanced Stability: Unified Nutrition split chip, secure deletion confirmation dialogs, and butter-smooth 120 FPS performance",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
