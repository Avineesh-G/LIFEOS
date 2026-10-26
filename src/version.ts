export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 69,
  versionName: '3.3.2',
  releaseDate: '2026-10-26',
  apkSize: '8.93 MB',
  apkSizeBytes: 9361966,
  releaseNotes: "LifeOS v3.3.2 (Build 69):\n• Layout Restoration: Reverted to standard clean vertical view layouts across Outings, Nutrition, Shopping Lists, and Laundry\n• Native Stability: Ensured 100% stable, jitter-free navigation across all device views\n• Full 120fps Performance: Optimized memory footprint and fluid gesture response",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
