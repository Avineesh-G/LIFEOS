export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 86,
  versionName: '3.4.9',
  releaseDate: '2026-11-21',
  apkSize: '15.03 MB',
  apkSizeBytes: 15761578,
  releaseNotes: "LifeOS v3.4.9 (Build 86):\n• Drive In-App PDF Viewer & AI Extraction: View uploaded PDFs directly in-app with intelligent multi-category AI extraction into Finance, Gym, Nutrition, Tasks, and Notes.\n• Nutrition AI Badge Layout Perfection: Redesigned 'Auto-Applied by AI' indicator and calorie metric with zero truncation or text wrapping.\n• Fluid Droplet Drag & Quick Access: 120Hz liquid droplet navigation with 6px instant drag sensitivity, boundary detent haptics, and 0ms Home navigation.\n• Instant 0ms Profile Picture: Synchronous local base64 avatar caching eliminates network loading delay on app startup.\n• Tasks Completed Log Seen-Mode: Completed tasks in historical list are view-only, preventing accidental re-activation.\n• Centered Luna Chatbot UI: Centered Luna hero with dockable quick prompt starters that auto-hide while typing.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
