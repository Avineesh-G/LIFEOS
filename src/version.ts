export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 93,
  versionName: '4.0.0',
  releaseDate: '2026-11-27',
  apkSize: '15.09 MB',
  apkSizeBytes: 15821844,
  releaseNotes: "LifeOS v4.0 (4.0.0 · Build 93):\n• Fixed Warm Brown Single-Hue Theme: Removed color adaptation from Settings and locked the entire app to Warm Brown (#7B4B36 → #A46D52, sand accent #D29B7E) across every interface, icon, and widget.\n• Six New Liquid Glass Interfaces: Added Focus Studio (/focus), Daily Journal & Wind-Down (/journal with 7-day week strip & task rollover), Inner Circle CRM (/circle), Projects & Milestones (/projects), Trips & Smart Packing (/trips), and Decision Workbench (/decisions).\n• Luna AI Co-Pilot & Privacy Hardening: Connected Luna AI across all 6 new interfaces with privacy/PII redaction (hideFromAi journal lock, phone/PNR scrubbing), confirmed tool actions, and contextual starter chips.\n• Alphabetical More Hub Organization: Grouped More Hub and bottom-dock slot customization by domain work and sorted sections & interfaces A–Z.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
