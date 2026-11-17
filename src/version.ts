export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 83,
  versionName: '3.4.6',
  releaseDate: '2026-11-17',
  apkSize: '15.03 MB',
  apkSizeBytes: 15755690,
  releaseNotes: "LifeOS v3.4.6 (Build 83):\n• Universal Google Sans Flex Typography: Integrated Google Sans Flex & Google Flex across all primary UI surfaces, sub-interfaces, and dialogs.\n• Always-Fresh New Chat: Guarantees that opening Luna AI always launches a fresh, clean conversation canvas while preserving historical threads in the Chat Threads drawer.\n• Ambient WebKit Collision Shield: Added multi-stop WebKit gradient masks and expanded scroll padding (+160px) to prevent message collisions under the bottom input dock.\n• Mobile Single-Glance Tables: Proportional table layouts for exercises and routines without horizontal clipping or scrolling.\n• Borderless OLED Action Confirmation Cards: Converted action proposals to borderless #141418 cards with responsive word wrapping and zero badge overflow.\n• Gmail Avatar & Masked API Key: Synchronous profile photo in the drawer footer with live Groq API key sync and asterisk masking.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
