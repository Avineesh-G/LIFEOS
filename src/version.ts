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
  versionName: '3.2.3',
  releaseDate: '2026-10-04',
  apkSize: '13.85 MB',
  apkSizeBytes: 14520000,
  releaseNotes: 'LifeOS v3.2.3 (Build 61):\n• Path Memory Navigation: Sequential back navigation across all interfaces so pressing back retraces your exact steps\n• Unified Hardware & Gesture Back: Closes active overlays/sheets first, then traverses path history step-by-step to root exit guard\n• Universal In-App Back Polish: All screen header back buttons and chevrons now seamlessly follow path memory',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
