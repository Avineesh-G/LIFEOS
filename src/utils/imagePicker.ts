import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface AttachedImage {
  id: string;
  dataUrl: string; // 'data:image/jpeg;base64,...'
  mimeType: string;
  fileName?: string;
}

/**
 * Checks if the current environment is a touch mobile device / native platform
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    Capacitor.isNativePlatform() ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

/**
 * Compresses an image data URL down to a maximum dimension and JPEG quality.
 * Keeps payloads lightweight (<300KB) for fast network transfer and minimal AI token consumption.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDimension = 1280,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(dataUrl);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Converts a standard browser File into a compressed AttachedImage
 */
export async function processFileToAttachedImage(file: File): Promise<AttachedImage | null> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawDataUrl = reader.result as string;
        const compressed = await compressImageDataUrl(rawDataUrl);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: compressed,
          mimeType: 'image/jpeg',
          fileName: file.name,
        });
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Web file picker fallback (safely mounted to DOM to avoid browser popup blockers)
 */
function pickImageFromWeb(capture = false): Promise<AttachedImage | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';

    // Only apply capture attribute if on actual mobile device
    if (capture && isMobileDevice()) {
      input.capture = 'environment';
    }

    document.body.appendChild(input);

    const cleanup = () => {
      try {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      } catch {}
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }

      const attached = await processFileToAttachedImage(file);
      resolve(attached);
    };

    input.oncancel = () => {
      cleanup();
      resolve(null);
    };

    // Trigger click synchronously
    input.click();
  });
}

/**
 * Capture a photo using the device camera.
 * - On Mobile (Android/iOS): Uses native Capacitor camera intent.
 * - On Web/Laptop: Handled via Webcam modal or file picker fallback.
 */
export async function capturePhotoFromCamera(): Promise<AttachedImage | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
      });

      if (!photo.base64String) return null;

      const mime = photo.format ? `image/${photo.format}` : 'image/jpeg';
      const rawDataUrl = `data:${mime};base64,${photo.base64String}`;
      const compressed = await compressImageDataUrl(rawDataUrl);

      return {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        dataUrl: compressed,
        mimeType: 'image/jpeg',
      };
    } catch (err: any) {
      if (err.message?.includes('cancelled') || err.message?.includes('User cancelled')) {
        return null;
      }
      console.warn('[Camera Native] Error:', err);
      return null;
    }
  }

  // Desktop / Mobile Web Fallback
  return pickImageFromWeb(true);
}

/**
 * Pick an image from the device photo gallery / storage.
 * - On Mobile: Uses native Android/iOS gallery intent.
 * - On Laptop: Opens system file chooser.
 */
export async function pickPhotoFromGallery(): Promise<AttachedImage | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        correctOrientation: true,
      });

      if (!photo.base64String) return null;

      const mime = photo.format ? `image/${photo.format}` : 'image/jpeg';
      const rawDataUrl = `data:${mime};base64,${photo.base64String}`;
      const compressed = await compressImageDataUrl(rawDataUrl);

      return {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        dataUrl: compressed,
        mimeType: 'image/jpeg',
      };
    } catch (err: any) {
      if (err.message?.includes('cancelled') || err.message?.includes('User cancelled')) {
        return null;
      }
      console.warn('[Gallery Native] Error:', err);
      return null;
    }
  }

  // Desktop / Mobile Web Fallback
  return pickImageFromWeb(false);
}
