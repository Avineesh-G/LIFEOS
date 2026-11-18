export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 85,
  versionName: '3.4.8',
  releaseDate: '2026-11-18',
  apkSize: '15.03 MB',
  apkSizeBytes: 15759996,
  releaseNotes: "LifeOS v3.4.8 (Build 85):\n• Blank Page Root Fix: Restored instant, reliable route rendering across all 15 interfaces, eliminating height collapse.\n• Complete Water Liquid Optics: Physics-grounded specular meniscus reflection rims and volumetric dark glass depth across all cards.\n• Rock-Solid Container Stability: Main cards stay firmly anchored on the canvas; interactions occur strictly inside sub-cards, buttons, and chips.\n• Multi-Tier Crisp Haptic Feedback: Distinct physical profiles for selection ticks, light touches, solid medium clicks, and dual-pulse ratchet confirmations.\n• 120Hz Droplet Drag Detents: Fluid navigation droplet scrubbing with tactile hardware detent ticks at every slot boundary.\n• Legacy UI Migration: Modernized Calendar event sheet with unified design system and streamlined daily quotes marquee.\n• Zero-Lag 120 FPS Performance: Replaced costly backdrop blur shaders with GPU-accelerated progressive OLED ambient scrims.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
