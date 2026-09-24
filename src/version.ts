export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 32,
  versionName: '2.0.8',
  releaseDate: '2026-09-24',
  releaseNotes: 'LifeOS v2.0.8 (Build 32):\n• High-performance 120 FPS M3 Expressive greeting with 10-minute cooldown\n• Instant in-app update popup & native phone notification alerts\n• Enhanced reload button with state preservation\n• Smooth cinematic home screen transition with zero frame drops',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
