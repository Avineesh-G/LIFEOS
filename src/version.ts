export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 62,
  versionName: '3.2.6',
  releaseDate: '2026-10-06',
  apkSize: '13.85 MB',
  apkSizeBytes: 14520000,
  releaseNotes: 'LifeOS v3.2.6 (Build 62):\n• 3-Tier Adaptive Performance Engine: Autonomously tunes graphics and memory per device hardware\n• Pure Water Droplet Glass & Dark UI: All surfaces refined to Apple Dark #141416 with color reserved for icons & text\n• Universal Path-Following Back Navigation: LIFO step-by-step backtracking across all pages to Home exit guard\n• Neural Infinity Iconography: Modernized AI Assistant across all interfaces\n• Redundant Space Elimination: Cleaned and normalized padding across all pages',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
