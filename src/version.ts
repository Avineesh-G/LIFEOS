export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 76,
  versionName: '3.3.9',
  releaseDate: '2026-11-14',
  apkSize: '10.22 MB',
  apkSizeBytes: 10720931,
  releaseNotes: "LifeOS v3.3.9 (Build 76):\n• Split Sector Calorie Architecture: 5 meal sectors (Breakfast, Lunch, Snacks, Dinner, Night Canteen) with slot-based chromatic arcs and curved radial labels.\n• Fluid Droplet Navigation: Water droplet sliding pill indicator on the floating navigation bar with spring-physics transitions.\n• Auto-Expanding Chat Viewport: Multi-line responsive textarea in Luna AI and overflow-scrolling table/code layouts.\n• Borderless OLED Surfaces: Complete elimination of white card outlines across hero and dashboard cards for seamless dark aesthetics.\n• Automated Hydration Notifications: Periodic 30-minute smart hydration reminders without manual logging friction.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
