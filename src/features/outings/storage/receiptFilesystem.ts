/**
 * LifeOS Native Filesystem Receipt Storage
 * 
 * Stores outing receipt image binaries in app-private native storage via @capacitor/filesystem
 * on native platforms, preventing bloat in IndexedDB and keeping image binaries out of Firestore.
 * Falls back to IndexedDB on Web/PWA.
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const RECEIPT_DIR = 'lifeos_receipts';

export async function isNativeFilesystemAvailable(): Promise<boolean> {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Filesystem');
}

/**
 * Ensures the receipts directory exists in app-private storage
 */
async function ensureReceiptsDir(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: RECEIPT_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (err: any) {
    // Ignore error if directory already exists
  }
}

/**
 * Saves binary base64 receipt data directly to native app-private filesystem
 */
export async function writeNativeReceipt(id: string, base64Data: string): Promise<string> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Filesystem')) {
    return `idb://${id}`;
  }

  try {
    await ensureReceiptsDir();
    const filePath = `${RECEIPT_DIR}/${id}.bin`;
    // Clean header if data URI is passed
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const res = await Filesystem.writeFile({
      path: filePath,
      data: cleanBase64,
      directory: Directory.Data,
    });

    return res.uri || filePath;
  } catch (err) {
    console.warn('[ReceiptFilesystem] Error writing native receipt, fallback to IDB:', err);
    return `idb://${id}`;
  }
}

/**
 * Reads binary base64 receipt data from native app-private filesystem
 */
export async function readNativeReceipt(id: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Filesystem')) {
    return null;
  }

  try {
    const filePath = `${RECEIPT_DIR}/${id}.bin`;
    const res = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
    });

    return typeof res.data === 'string' ? res.data : null;
  } catch (err) {
    console.warn('[ReceiptFilesystem] Error reading native receipt:', err);
    return null;
  }
}

/**
 * Deletes receipt file from native app-private filesystem
 */
export async function deleteNativeReceipt(id: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Filesystem')) {
    return;
  }

  try {
    const filePath = `${RECEIPT_DIR}/${id}.bin`;
    await Filesystem.deleteFile({
      path: filePath,
      directory: Directory.Data,
    });
  } catch (err) {
    // Ignore if already deleted
  }
}
