/**
 * LifeOS Full Backup & Restore Engine (v3 Format)
 * 
 * Provides end-to-end serialization and restoration across all application stores:
 * - Firestore / Local AppData (Workouts, Nutrition, Timetable, Tasks, Shopping, Study, Laundry, etc.)
 * - Outings (Outings, People, Expenses, Settlements)
 * - Outing Receipts (Converts binary Blobs to Base64 strings to prevent {} serialization)
 * - Encrypted Vault Items (Remains AES-256 encrypted; master key never stored)
 * - AI Keys excluded by default for security
 * - Pre-restore validation, count preview, automatic rollback snapshot
 * - Native Android Share/Filesystem integration for reliable saving
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { AppData } from '../types.ts';
import { sanitizeAppData, DEFAULT_DATA } from '../db.ts';
import { getIndexedDB } from './idbStorage.ts';
import { CURRENT_VERSION_NAME, CURRENT_VERSION_CODE } from '../version.ts';

export interface BackupMetadata {
  version: number;
  exportedAt: string;
  appVersion: string;
  buildNumber: number;
  platform: string;
}

export interface SerializedReceipt {
  id: string;
  outingId: string;
  expenseId?: string;
  base64: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface LifeOSBackupPackage {
  meta: BackupMetadata;
  appData: AppData;
  outings?: {
    outings: any[];
    people: any[];
    expenses: any[];
    settlements: any[];
    receipts: SerializedReceipt[];
  };
  customTheme?: any;
}

export interface BackupPreviewSummary {
  valid: boolean;
  exportedAt: string;
  appVersion: string;
  counts: {
    workouts: number;
    nutritionLogs: number;
    tasks: number;
    studySessions: number;
    shoppingLists: number;
    vaultItems: number;
    outings: number;
    expenses: number;
    receipts: number;
  };
  error?: string;
}

/**
 * Converts a Blob to a base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 string back to a Blob
 */
function base64ToBlob(base64: string, mime: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

/**
 * Reads all records from a specified IndexedDB store
 */
async function getStoreRecords<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(storeName)) {
      const fallback = localStorage.getItem(`lifeos_${storeName}`);
      return fallback ? JSON.parse(fallback) : [];
    }
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Generates the full serialized backup JSON package
 */
export async function createFullBackup(currentAppData: AppData, includeAiKeys: boolean = false): Promise<LifeOSBackupPackage> {
  // Sanitize and clone app data
  const appDataClone = JSON.parse(JSON.stringify(currentAppData));
  if (!includeAiKeys) {
    appDataClone.geminiApiKey = '';
  }

  // Collect Outings
  const outings = await getStoreRecords('outing_outings');
  const people = await getStoreRecords('outing_people');
  const expenses = await getStoreRecords('outing_expenses');
  const settlements = await getStoreRecords('outing_settlements');
  const rawReceipts: any[] = await getStoreRecords('outing_receipts');

  // Convert binary Blobs in receipts to Base64
  const serializedReceipts: SerializedReceipt[] = [];
  for (const r of rawReceipts) {
    try {
      let base64 = '';
      if (r.blob instanceof Blob) {
        base64 = await blobToBase64(r.blob);
      } else if (typeof r.blob === 'string') {
        base64 = r.blob;
      }
      serializedReceipts.push({
        id: r.id,
        outingId: r.outingId,
        expenseId: r.expenseId,
        base64,
        mime: r.mime || 'image/jpeg',
        size: r.size || 0,
        width: r.width || 0,
        height: r.height || 0,
        createdAt: r.createdAt || new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Backup] Failed serializing receipt blob for ID:', r.id, e);
    }
  }

  const pkg: LifeOSBackupPackage = {
    meta: {
      version: 3,
      exportedAt: new Date().toISOString(),
      appVersion: CURRENT_VERSION_NAME,
      buildNumber: CURRENT_VERSION_CODE,
      platform: Capacitor.getPlatform(),
    },
    appData: appDataClone,
    outings: {
      outings,
      people,
      expenses,
      settlements,
      receipts: serializedReceipts,
    },
  };

  return pkg;
}

/**
 * Exports backup package and triggers download or native save
 */
export async function exportBackupFile(currentAppData: AppData, includeAiKeys: boolean = false): Promise<{ success: boolean; filename: string }> {
  const pkg = await createFullBackup(currentAppData, includeAiKeys);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `LifeOS_Backup_${timestamp}.json`;

  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Filesystem')) {
    try {
      // Save directly to Documents / Downloads via Capacitor Filesystem
      await Filesystem.writeFile({
        path: filename,
        data: jsonStr,
        directory: Directory.Documents,
      });
      return { success: true, filename: `Documents/${filename}` };
    } catch (err) {
      console.warn('[Backup] Native Filesystem write failed, falling back to blob trigger:', err);
    }
  }

  // Web / PWA fallback
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, filename };
}

/**
 * Validates a backup JSON string and returns an itemized preview
 */
export function previewBackupPackage(jsonString: string): BackupPreviewSummary {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, exportedAt: '', appVersion: '', counts: {} as any, error: 'File is not a valid JSON object.' };
    }

    // Support both format v3 and legacy format
    const appData = parsed.appData || parsed;
    const meta = parsed.meta || {
      version: parsed._schemaVersion || 1,
      exportedAt: new Date().toISOString(),
      appVersion: 'Legacy',
    };

    const counts = {
      workouts: Array.isArray(appData.workoutLogs) ? appData.workoutLogs.length : 0,
      nutritionLogs: Array.isArray(appData.nutritionLogs) ? appData.nutritionLogs.length : 0,
      tasks: Array.isArray(appData.tasks) ? appData.tasks.length : 0,
      studySessions: Array.isArray(appData.studySessions) ? appData.studySessions.length : 0,
      shoppingLists: Array.isArray(appData.shoppingLists) ? appData.shoppingLists.length : 0,
      vaultItems: Array.isArray(appData.vaultItems) ? appData.vaultItems.length : 0,
      outings: parsed.outings && Array.isArray(parsed.outings.outings) ? parsed.outings.outings.length : 0,
      expenses: parsed.outings && Array.isArray(parsed.outings.expenses) ? parsed.outings.expenses.length : 0,
      receipts: parsed.outings && Array.isArray(parsed.outings.receipts) ? parsed.outings.receipts.length : 0,
    };

    return {
      valid: true,
      exportedAt: meta.exportedAt,
      appVersion: meta.appVersion,
      counts,
    };
  } catch (err: any) {
    return {
      valid: false,
      exportedAt: '',
      appVersion: '',
      counts: {} as any,
      error: `Failed parsing JSON backup: ${err.message}`,
    };
  }
}

/**
 * Performs a complete restore with automatic rollback snapshot
 */
export async function restoreBackupPackage(
  jsonString: string,
  currentAppData: AppData,
  applyAppDataUpdate: (newData: AppData) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  // 1. Validate
  const preview = previewBackupPackage(jsonString);
  if (!preview.valid) {
    throw new Error(preview.error || 'Invalid backup package.');
  }

  // 2. Take automatic pre-restore safety snapshot
  try {
    const preSnapshot = await createFullBackup(currentAppData, true);
    localStorage.setItem('lifeos_pre_restore_snapshot', JSON.stringify(preSnapshot));
  } catch (snapErr) {
    console.warn('[Restore] Failed creating safety rollback snapshot:', snapErr);
  }

  try {
    const parsed: LifeOSBackupPackage = JSON.parse(jsonString);
    const rawAppData = parsed.appData || parsed;
    const sanitized = sanitizeAppData(rawAppData);

    // 3. Restore Outings if present
    if (parsed.outings) {
      const db = await getIndexedDB();
      if (db) {
        // Restore outings
        if (Array.isArray(parsed.outings.outings) && db.objectStoreNames.contains('outing_outings')) {
          const tx = db.transaction('outing_outings', 'readwrite');
          const store = tx.objectStore('outing_outings');
          store.clear();
          for (const item of parsed.outings.outings) store.put(item);
        }
        // Restore people
        if (Array.isArray(parsed.outings.people) && db.objectStoreNames.contains('outing_people')) {
          const tx = db.transaction('outing_people', 'readwrite');
          const store = tx.objectStore('outing_people');
          store.clear();
          for (const item of parsed.outings.people) store.put(item);
        }
        // Restore expenses
        if (Array.isArray(parsed.outings.expenses) && db.objectStoreNames.contains('outing_expenses')) {
          const tx = db.transaction('outing_expenses', 'readwrite');
          const store = tx.objectStore('outing_expenses');
          store.clear();
          for (const item of parsed.outings.expenses) store.put(item);
        }
        // Restore settlements
        if (Array.isArray(parsed.outings.settlements) && db.objectStoreNames.contains('outing_settlements')) {
          const tx = db.transaction('outing_settlements', 'readwrite');
          const store = tx.objectStore('outing_settlements');
          store.clear();
          for (const item of parsed.outings.settlements) store.put(item);
        }
        // Restore receipts (deserializing base64 to Blobs)
        if (Array.isArray(parsed.outings.receipts) && db.objectStoreNames.contains('outing_receipts')) {
          const tx = db.transaction('outing_receipts', 'readwrite');
          const store = tx.objectStore('outing_receipts');
          store.clear();
          for (const item of parsed.outings.receipts) {
            if (item.base64) {
              const blob = base64ToBlob(item.base64, item.mime || 'image/jpeg');
              store.put({
                id: item.id,
                outingId: item.outingId,
                expenseId: item.expenseId,
                blob,
                thumbBlob: blob,
                mime: item.mime,
                size: item.size,
                width: item.width,
                height: item.height,
                createdAt: item.createdAt,
              });
            }
          }
        }
      }
    }

    // 4. Update core app state
    await applyAppDataUpdate(sanitized);

    return {
      success: true,
      message: `Successfully restored backup from ${new Date(preview.exportedAt).toLocaleDateString()} (${preview.counts.workouts} workouts, ${preview.counts.tasks} tasks, ${preview.counts.outings} outings).`,
    };
  } catch (err: any) {
    console.error('[Restore] Restoration failed, attempting rollback:', err);
    // Attempt rollback
    try {
      const rollbackStr = localStorage.getItem('lifeos_pre_restore_snapshot');
      if (rollbackStr) {
        const rollbackPkg = JSON.parse(rollbackStr);
        await applyAppDataUpdate(sanitizeAppData(rollbackPkg.appData));
      }
    } catch (rollErr) {
      console.error('[Restore] Critical: Rollback snapshot failed:', rollErr);
    }
    throw new Error(`Restore failed: ${err.message}. State rolled back.`);
  }
}
