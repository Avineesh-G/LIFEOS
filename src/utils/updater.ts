import { registerPlugin, Capacitor } from '@capacitor/core';

export const CURRENT_VERSION_CODE = 20;
export const CURRENT_VERSION_NAME = '1.6';

export const GITHUB_RAW_APK_URL = 'https://github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk';
export const REMOTE_VERSION_URLS = [
  '/version.json',
  'https://lifeos-gujjeti-avineeshs-projects.vercel.app/version.json',
  'https://raw.githubusercontent.com/Avineesh-G/LIFEOS/main/public/version.json'
];

export interface AppVersionInfo {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkUrl: string;
}

export interface DownloadProgressEvent {
  progress: number; // 0 - 100, or -1 if content length unknown
  bytesRead: number;
  totalBytes: number;
}

export interface ApkInstallerPluginType {
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean; message: string }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (data: DownloadProgressEvent) => void
  ): Promise<any>;
  addListener(
    eventName: 'downloadError',
    listenerFunc: (data: { error: string }) => void
  ): Promise<any>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPluginType>('ApkInstaller');

/**
 * Checks if the app is running as a native Android Capacitor app
 */
export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Fetches version metadata from remote endpoints with fast fallback & timeout
 */
export async function fetchRemoteVersion(): Promise<AppVersionInfo | null> {
  const timestamp = Date.now();
  for (const baseUrl of REMOTE_VERSION_URLS) {
    try {
      const url = `${baseUrl}?t=${timestamp}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store'
        // No custom headers to avoid CORS OPTIONS preflight rejections
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.versionCode === 'number') {
          return data as AppVersionInfo;
        }
      }
    } catch (err) {
      console.warn(`[LifeOS Updater] Failed to check ${baseUrl}:`, err);
    }
  }
  return null;
}

/**
 * Compares remote version with current local bundle
 */
export async function checkForAppUpdate(): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  remoteVersion: AppVersionInfo | null;
}> {
  const remote = await fetchRemoteVersion();
  if (!remote) {
    return { hasUpdate: false, currentVersion: CURRENT_VERSION_NAME, remoteVersion: null };
  }

  // Update exists if remote versionCode is higher than current build
  const hasUpdate = remote.versionCode > CURRENT_VERSION_CODE;

  return {
    hasUpdate,
    currentVersion: CURRENT_VERSION_NAME,
    remoteVersion: remote,
  };
}

/**
 * Check if Android has permission to install unknown apps / self-update
 */
export async function checkCanInstallApk(): Promise<boolean> {
  if (!isNativeAndroid()) return true;
  try {
    const res = await ApkInstaller.canRequestPackageInstalls();
    return res.canInstall;
  } catch {
    return true;
  }
}

/**
 * Opens system settings page to grant install permission
 */
export async function openInstallSettings(): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    await ApkInstaller.openInstallPermissionSettings();
  } catch (e) {
    console.error('Failed to open install settings', e);
  }
}

/**
 * Starts in-app download and native package installation
 */
export async function startApkUpdate(
  apkUrl: string,
  onProgress: (prog: DownloadProgressEvent) => void,
  onError: (err: string) => void
): Promise<void> {
  // Determine full target URL: on native Android, use direct public internet URL
  let targetUrl: string;
  if (apkUrl.startsWith('http://') || apkUrl.startsWith('https://')) {
    targetUrl = apkUrl;
  } else if (isNativeAndroid()) {
    targetUrl = GITHUB_RAW_APK_URL;
  } else {
    targetUrl = new URL(apkUrl, window.location.origin).href;
  }

  if (isNativeAndroid()) {
    let progressSub: any;
    let errorSub: any;

    try {
      progressSub = await ApkInstaller.addListener('downloadProgress', (data) => {
        onProgress(data);
      });

      errorSub = await ApkInstaller.addListener('downloadError', (err) => {
        onError(err.error || 'Download failed');
      });

      // Trigger native download and package installer
      await ApkInstaller.downloadAndInstall({ url: targetUrl });
    } catch (err: any) {
      onError(err.message || 'Failed to start in-app installer');
    } finally {
      if (progressSub) progressSub.remove();
      if (errorSub) errorSub.remove();
    }
  } else {
    // Web / PWA fallback: direct anchor download
    try {
      onProgress({ progress: 100, bytesRead: 1, totalBytes: 1 });
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = 'LifeOS.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      onError(err.message || 'Web download failed');
    }
  }
}
