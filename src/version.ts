export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 65,
  versionName: '3.2.8',
  releaseDate: '2026-10-22',
  apkSize: '8.78 MB',
  apkSizeBytes: 9204884,
  releaseNotes: 'LifeOS v3.2.8 (Build 65):\n• Standalone Luna AI Floating Bar: Extracted chatbot launcher into an independent liquid glass capsule beside the main navigation bar\n• Minimal Monochrome Luna Icon: Streamlined 8-point geometric speech bubble icon matching system-wide aesthetic without distracting color blobs\n• Account-Aware Greeting: Personalized empty state directly welcoming the user with their profile name\n• Refined Chat & Settings Interface: Clean liquid glass surfaces with seamless Groq inference and Google Sans Flex typography',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
