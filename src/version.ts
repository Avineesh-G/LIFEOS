export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 66,
  versionName: '3.2.9',
  releaseDate: '2026-10-22',
  apkSize: '8.97 MB',
  apkSizeBytes: 9403082,
  releaseNotes: 'LifeOS v3.2.9 (Build 66):\n• Fluid 120 FPS Page Transitions: Decoupled route transitions using asynchronous mode="wait" and GPU layer isolation, completely eliminating micro-stutters and freeze states\n• Dynamic Compositor Performance Shield: Temporarily suspends multi-pass backdrop-filters during navigation animations for buttery smooth page changes\n• Synchronous Viewport Scroll Alignment: Zero visual jumping or vertical snapping during interface switches\n• Standalone Luna AI Floating Bar: Extracted chatbot launcher into an independent liquid glass capsule beside the main navigation bar\n• Minimal Monochrome Luna Icon: Streamlined 8-point geometric speech bubble icon matching system-wide aesthetic without distracting color blobs',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
