export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 71,
  versionName: '3.3.4',
  releaseDate: '2026-11-04',
  apkSize: '10.17 MB',
  apkSizeBytes: 10667352,
  releaseNotes: "LifeOS v3.3.4 (Build 71):\n• Universal Voice AI: Automatic multilingual speech recognition across English, Telugu, Hindi, Tamil, and global languages with zero misdetection\n• Camera & Multimodal Vision: Snap or upload study notes and exam analysis directly into Luna AI\n• Fast Auto-Transcription: Real-time audio processing with automatic language analysis directly into chat\n• November 2026 Mess Menu: Complete 30-day schedule with full Veg, Non-Veg, and Special Mess options\n• Native Stability: Jitter-free navigation and 120 FPS fluid motion across all device views",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
