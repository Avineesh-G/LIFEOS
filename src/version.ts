export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 73,
  versionName: '3.3.6',
  releaseDate: '2026-11-08',
  apkSize: '10.18 MB',
  apkSizeBytes: 10677532,
  releaseNotes: "LifeOS v3.3.6 (Build 73):\n• Zero Cross-User Contamination: Strict tenant isolation across local cache, Firestore auto-healing, and Outings ensuring complete privacy between user accounts.\n• Drive Live Upload Ticker: Active continuous progress indicator showing real-time upload percentage from 25% through completion.\n• Folder Palette & Accent Matching: Added Burgundy (#9F1239) and curated jewel tones with file icons dynamically inheriting their parent folder accent.\n• Reader & Interface Polish: Streamlined file inspection view, removed redundant buttons for spacious mobile layout, and perfected modal backdrops.\n• Timely Event Notifications: Optimized exact alarm scheduling with reminders fixed 20 mins before events and immediate starting alerts.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
