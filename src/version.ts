export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 61,
  versionName: '3.2.5',
  releaseDate: '2026-10-04',
  apkSize: '13.85 MB',
  apkSizeBytes: 14520000,
  releaseNotes: 'LifeOS v3.2.5 (Build 61):\n• Liquid Metaball Navigation: Organic diving waist with soft liquid refraction aura and pure icon navigation\n• Exact Route Memory Backtracking: Universal sequential back navigation across all interfaces to Home\n• Apple SF Symbols Iconography: Unified optical weighting across all screens and sheets\n• Refined Dashboard Metrics: Seamless embedded rings and harmonized card spacing',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
