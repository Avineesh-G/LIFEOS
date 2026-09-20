/**
 * LifeOS — Outing Receipts Off-Main-Thread Compressor
 * 
 * Compresses receipts before saving:
 * - Full-size image: Long edge max 1600px, JPEG quality 0.72
 * - Thumbnail: Long edge max 320px, JPEG quality 0.70
 * - Uses createImageBitmap + OffscreenCanvas (falling back to HTMLCanvasElement)
 * - Returns pure Blobs for direct IndexedDB storage (never stores base64 in state)
 */

import { MAX_IMAGE_LONG_EDGE, THUMB_IMAGE_SIZE, JPEG_COMPRESSION_QUALITY } from '../constants';

export interface CompressedReceiptResult {
  blob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
  size: number;
  mime: string;
}

function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (srcWidth <= maxDimension && srcHeight <= maxDimension) {
    return { width: srcWidth, height: srcHeight };
  }

  const aspectRatio = srcWidth / srcHeight;
  if (srcWidth > srcHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
}

export async function compressReceiptImage(fileOrBlob: Blob): Promise<CompressedReceiptResult> {
  const bitmap = await createImageBitmap(fileOrBlob);
  const origWidth = bitmap.width;
  const origHeight = bitmap.height;

  // 1. Calculate dimensions
  const fullDim = calculateDimensions(origWidth, origHeight, MAX_IMAGE_LONG_EDGE);
  const thumbDim = calculateDimensions(origWidth, origHeight, THUMB_IMAGE_SIZE);

  let fullBlob: Blob;
  let thumbBlob: Blob;

  // Check OffscreenCanvas support
  const supportsOffscreen = typeof OffscreenCanvas !== 'undefined';

  if (supportsOffscreen) {
    // 2. Full compressed image via OffscreenCanvas
    const fullCanvas = new OffscreenCanvas(fullDim.width, fullDim.height);
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) throw new Error('Could not get OffscreenCanvas 2D context');
    fullCtx.drawImage(bitmap, 0, 0, fullDim.width, fullDim.height);
    fullBlob = await fullCanvas.convertToBlob({
      type: 'image/jpeg',
      quality: JPEG_COMPRESSION_QUALITY,
    });

    // 3. Thumbnail image via OffscreenCanvas
    const thumbCanvas = new OffscreenCanvas(thumbDim.width, thumbDim.height);
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) throw new Error('Could not get OffscreenCanvas 2D context for thumbnail');
    thumbCtx.drawImage(bitmap, 0, 0, thumbDim.width, thumbDim.height);
    thumbBlob = await thumbCanvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.7,
    });
  } else {
    // Fallback using document.createElement('canvas')
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullDim.width;
    fullCanvas.height = fullDim.height;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) throw new Error('Could not get Canvas 2D context');
    fullCtx.drawImage(bitmap, 0, 0, fullDim.width, fullDim.height);

    fullBlob = await new Promise<Blob>((resolve, reject) => {
      fullCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        JPEG_COMPRESSION_QUALITY
      );
    });

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbDim.width;
    thumbCanvas.height = thumbDim.height;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) throw new Error('Could not get Canvas 2D context for thumbnail');
    thumbCtx.drawImage(bitmap, 0, 0, thumbDim.width, thumbDim.height);

    thumbBlob = await new Promise<Blob>((resolve, reject) => {
      thumbCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        0.7
      );
    });
  }

  // Close the ImageBitmap to release memory immediately
  if ('close' in bitmap) {
    bitmap.close();
  }

  return {
    blob: fullBlob,
    thumbBlob,
    width: fullDim.width,
    height: fullDim.height,
    size: fullBlob.size,
    mime: 'image/jpeg',
  };
}
