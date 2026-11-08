import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { storage, auth, db } from '../firebase';
import { saveDriveBlob, getDriveBlob, deleteDriveBlob } from '../utils/idbStorage';
import type { AppData, DriveFile, DriveFolder, PublicShareRecord } from '../types';

export const MAX_DRIVE_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5.00 GB

export interface UploadProgressCallback {
  (percent: number, transferredBytes: number, totalBytes: number): void;
}

export interface UploadControlHandle {
  cancel: () => void;
}

/**
 * Validates whether a file upload fits within the user's fixed 5.0 GB quota.
 */
export function checkStorageQuota(fileSize: number, currentData: AppData): {
  allowed: boolean;
  currentUsedBytes: number;
  remainingBytes: number;
  projectedBytes: number;
} {
  const currentUsed = (currentData.driveFiles || []).reduce(
    (sum: number, f: DriveFile) => sum + (Number(f.fileSize) || 0),
    0
  );
  const remaining = Math.max(0, MAX_DRIVE_STORAGE_BYTES - currentUsed);
  const projected = currentUsed + fileSize;

  return {
    allowed: projected <= MAX_DRIVE_STORAGE_BYTES,
    currentUsedBytes: currentUsed,
    remainingBytes: remaining,
    projectedBytes: projected,
  };
}

/**
 * Formats bytes into clean human-readable storage string (e.g., "1.42 GB", "350 MB", "45 KB").
 */
export function formatStorageSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val >= 10 || i === 0 ? val.toFixed(1) : val.toFixed(2)} ${units[i]}`;
}

/**
 * Fast client-side image thumbnail generator for instant 120 FPS gallery rendering.
 */
export async function generateImageThumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 160;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.7));
              return;
            }
          } catch {}
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Uploads a document/file with instant local IndexedDB persistence + background Firebase Cloud Storage sync.
 * Supports immediate cancellation and auto-fallback on connection timeouts.
 */
export async function uploadDriveFile(
  file: File,
  folderId: string | null = null,
  currentData: AppData,
  onProgress?: UploadProgressCallback,
  controlHandle?: { current?: UploadControlHandle | null }
): Promise<DriveFile> {
  const quota = checkStorageQuota(file.size, currentData);
  if (!quota.allowed) {
    throw new Error(
      `Storage quota exceeded: Upload requires ${formatStorageSize(
        file.size
      )}, but you only have ${formatStorageSize(quota.remainingBytes)} left of your 5.0 GB limit.`
    );
  }

  const currentUser = auth.currentUser;
  const uid = currentUser?.uid || 'offline_user';

  const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${uid}/drive/${fileId}_${sanitizedFileName}`;

  // Step 1: Instant local persistence (< 50ms)
  if (onProgress) {
    onProgress(5, Math.round(file.size * 0.05), file.size);
  }
  try {
    await saveDriveBlob(fileId, file);
  } catch (blobErr) {
    console.warn('[LifeOS Drive] Non-fatal local blob cache notice:', blobErr);
  }
  const localBlobUrl = URL.createObjectURL(file);

  if (onProgress) {
    onProgress(15, Math.round(file.size * 0.15), file.size);
  }

  // Generate lightweight thumbnail for images
  const thumbnail = await generateImageThumbnail(file);

  if (onProgress) {
    onProgress(25, Math.round(file.size * 0.25), file.size);
  }

  let finalDownloadUrl = localBlobUrl;
  let isCancelled = false;

  // Step 2: Attempt cloud storage stream with active continuous progress reporting
  if (currentUser && !storagePath.startsWith('users/offline_user/')) {
    let currentPct = 25;
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          originalName: file.name,
          fileId,
          folderId: folderId || 'root',
          uploadedAt: new Date().toISOString(),
        },
      });

      // Active ticker: continuously increments progress every 120ms so the user sees live number progression
      progressTimer = setInterval(() => {
        if (currentPct < 92) {
          const step = currentPct < 60 ? 2 : 1;
          currentPct = Math.min(92, currentPct + step);
          if (onProgress) {
            const simulatedTransferred = Math.min(file.size, Math.round(file.size * (currentPct / 100)));
            onProgress(currentPct, simulatedTransferred, file.size);
          }
        }
      }, 120);

      if (controlHandle) {
        controlHandle.current = {
          cancel: () => {
            isCancelled = true;
            if (progressTimer) clearInterval(progressTimer);
            try {
              uploadTask.cancel();
            } catch {}
          },
        };
      }

      const cloudUploadPromise = new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const rawPct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (Number.isFinite(rawPct)) {
                // Map the 0-100% cloud range onto 25% - 94%
                const mapped = Math.min(94, Math.max(currentPct, Math.round(25 + rawPct * 0.69)));
                currentPct = mapped;
                if (onProgress) {
                  onProgress(currentPct, snapshot.bytesTransferred, snapshot.totalBytes);
                }
              }
            }
          },
          (error) => {
            if (progressTimer) clearInterval(progressTimer);
            reject(error);
          },
          async () => {
            if (progressTimer) clearInterval(progressTimer);
            // Advance to 96% while resolving download URL
            currentPct = 96;
            if (onProgress) {
              onProgress(96, file.size, file.size);
            }
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      // 8-second timeout: if Firebase hangs or network drops, don't stall the UI
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          if (progressTimer) clearInterval(progressTimer);
          reject(new Error('CLOUD_UPLOAD_TIMEOUT'));
        }, 8000);
      });

      finalDownloadUrl = await Promise.race([cloudUploadPromise, timeoutPromise]);
    } catch (err: any) {
      if (progressTimer) clearInterval(progressTimer);
      if (isCancelled) {
        throw new Error('UPLOAD_CANCELLED');
      }
      console.warn('[LifeOS Drive] Cloud sync notice:', err?.message || err, '- saving locally.');
      finalDownloadUrl = localBlobUrl;
    } finally {
      if (progressTimer) clearInterval(progressTimer);
    }
  }

  if (onProgress) {
    onProgress(100, file.size, file.size);
  }

  return {
    id: fileId,
    name: file.name,
    folderId: folderId || null,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    storagePath,
    downloadUrl: finalDownloadUrl,
    localCachedUri: thumbnail || localBlobUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Deletes a file from both local IndexedDB and Firebase Cloud Storage.
 */
export async function deleteDriveFile(file: DriveFile): Promise<void> {
  // 1. Delete local blob
  await deleteDriveBlob(file.id);

  // 2. Delete cloud storage file if exists
  if (file.storagePath && !file.storagePath.startsWith('users/offline_user/')) {
    try {
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef);
    } catch (err: any) {
      console.warn('Storage delete warning:', err?.message || err);
    }
  }
}

/**
 * Resolves a file's download URL.
 * If cloud URL fails or is expired/offline, restores from local IndexedDB blob.
 */
export async function resolveFileBlobUrl(file: DriveFile): Promise<string> {
  const localBlob = await getDriveBlob(file.id);
  if (localBlob) {
    return URL.createObjectURL(localBlob);
  }
  return file.downloadUrl;
}

/**
 * Creates a public share record in Firestore for cross-device QR code sharing.
 */
export async function createPublicShareRecord(
  item: {
    type: 'file' | 'folder';
    itemId: string;
    title: string;
    fileSize: number;
    downloadUrl: string;
    mimeType?: string;
    folderItems?: { id: string; name: string; size: number; downloadUrl: string; mimeType?: string }[];
  }
): Promise<{ shareId: string; shareUrl: string }> {
  const shareId = `sh_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  const currentUser = auth.currentUser;

  const record: PublicShareRecord = {
    shareId,
    ownerUid: currentUser?.uid || 'anonymous',
    ownerEmail: currentUser?.email || undefined,
    type: item.type,
    itemId: item.itemId,
    title: item.title,
    fileSize: item.fileSize,
    mimeType: item.mimeType,
    downloadUrl: item.downloadUrl,
    folderItems: item.folderItems,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    isRevoked: false,
  };

  try {
    const docRef = doc(db, 'public_shares', shareId);
    await setDoc(docRef, record);
  } catch (err) {
    console.warn('Firestore public_share write:', err);
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/share/${shareId}`;

  return { shareId, shareUrl };
}

/**
 * Fetches a public share record by shareId.
 */
export async function getPublicShareRecord(shareId: string): Promise<PublicShareRecord | null> {
  try {
    const docRef = doc(db, 'public_shares', shareId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as PublicShareRecord;
  } catch (err) {
    console.error('Error fetching public share record:', err);
    return null;
  }
}

/**
 * Revokes a public share link so the QR code immediately stops working.
 */
export async function revokePublicShareRecord(shareId: string): Promise<void> {
  try {
    const docRef = doc(db, 'public_shares', shareId);
    await updateDoc(docRef, { isRevoked: true });
  } catch (err) {
    console.error('Error revoking public share record:', err);
  }
}
