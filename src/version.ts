export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 51,
  versionName: '3.0.0',
  releaseDate: '2026-10-02',
  apkSize: '13.8 MB',
  apkSizeBytes: 14424234,
  releaseNotes: 'LifeOS v3.0.0 (Build 2):\n• Refined compact bottom navigation dock with thin theme borders\n• Centered mobile Ask LifeOS chat pop-up with keyboard awareness\n• Improved Groq AI multi-model fallbacks & voice transcription',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
