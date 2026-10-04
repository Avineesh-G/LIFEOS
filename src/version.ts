export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 59,
  versionName: '3.2.1',
  releaseDate: '2026-10-04',
  apkSize: '13.84 MB',
  apkSizeBytes: 14515371,
  releaseNotes: 'LifeOS v3.2.1 (Build 59):\n• Luna AI Mascot & Chat Refinement: Scaled interactive mascot doll, enlarged ambient aura, refined quick prompt chips, and placeholder polish\n• Android Microphone Audio Fix: Added RECORD_AUDIO permissions and runtime permission prompt to prevent access denial on voice recording\n• Clean Slate Engine: Removed mock flashcards and test speech fallbacks for 100% genuine user data\n• Mobile Responsive UI: Streamlined card geometry and spacing across all mobile aspect ratios',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
