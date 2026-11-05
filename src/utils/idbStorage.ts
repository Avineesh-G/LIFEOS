/**
 * LifeOS — HMR-Safe Single-Connection IndexedDB Manager
 * 
 * Satisfies Requirement D & F:
 * - Opens exactly one connection via a module singleton
 * - Handles 'versionchange' by closing the old connection
 * - Handles 'blocked' with visible warnings
 * - Closes connection on import.meta.hot.dispose
 * - Migrates and falls back gracefully to localStorage if IndexedDB is blocked/unavailable
 */

const DB_NAME = 'lifeos_local_cache';
const DB_VERSION = 6;
const STORE_NAME = 'app_state';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

export function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
        const outingStores = [
          'outing_outings',
          'outing_people',
          'outing_expenses',
          'outing_settlements',
          'outing_receipts',
        ];
        for (const store of outingStores) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
        // Dedicated Notes store
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        // Dedicated Drive file blobs store
        if (!db.objectStoreNames.contains('drive_blobs')) {
          db.createObjectStore('drive_blobs', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;

        // Requirement D: Close old connection when another tab or upgrade requests versionchange
        dbInstance.onversionchange = () => {
          console.warn('[LifeOS IDB] Database version change requested elsewhere. Closing connection.');
          dbInstance?.close();
          dbInstance = null;
          dbPromise = null;
        };

        dbInstance.onerror = (e) => {
          console.error('[LifeOS IDB] Database runtime error:', e);
        };

        resolve(dbInstance);
      };

      request.onerror = (e) => {
        console.warn('[LifeOS IDB] IndexedDB open error, falling back to localStorage:', e);
        dbPromise = null;
        resolve(null);
      };

      // Requirement D: Handle 'blocked' with a visible message
      request.onblocked = () => {
        console.warn('[LifeOS IDB] Database upgrade blocked by another active tab. Please close other LifeOS tabs.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('lifeos-db-blocked', {
              detail: 'Database upgrade is waiting for other tabs to close.',
            })
          );
        }
      };
    } catch (err) {
      console.warn('[LifeOS IDB] Exception opening IndexedDB:', err);
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

export function closeIndexedDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPromise = null;
  }
}

// Requirement D: Close connection in import.meta.hot.dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    closeIndexedDB();
  });
}

export async function setIdbItem(key: string, value: any): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).put({ key, value, updatedAt: Date.now() });
    });
  } catch (e) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
}

export async function getIdbItem<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getIndexedDB();
    if (!db) {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          // Fallback check in localStorage
          const raw = localStorage.getItem(key);
          resolve(raw ? (JSON.parse(raw) as T) : null);
        }
      };
      req.onerror = () => {
        const raw = localStorage.getItem(key);
        resolve(raw ? (JSON.parse(raw) as T) : null);
      };
    });
  } catch {
    return null;
  }
}

export async function saveDriveBlob(id: string, blob: Blob): Promise<void> {
  try {
    let db = await getIndexedDB();
    if (!db) return;

    if (!db.objectStoreNames.contains('drive_blobs')) {
      console.warn('[LifeOS IDB] drive_blobs store missing, refreshing DB connection...');
      closeIndexedDB();
      db = await getIndexedDB();
      if (!db || !db.objectStoreNames.contains('drive_blobs')) {
        console.warn('[LifeOS IDB] drive_blobs store still unavailable, skipping local blob cache.');
        return;
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('drive_blobs', 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => {
          console.warn('[LifeOS IDB] saveDriveBlob tx error:', e);
          resolve();
        };
        tx.objectStore('drive_blobs').put({ id, blob, updatedAt: Date.now() });
      } catch (txErr) {
        console.warn('[LifeOS IDB] saveDriveBlob tx catch:', txErr);
        resolve();
      }
    });
  } catch (err) {
    console.warn('[LifeOS IDB] saveDriveBlob warning:', err);
  }
}

export async function getDriveBlob(id: string): Promise<Blob | null> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains('drive_blobs')) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('drive_blobs', 'readonly');
        const req = tx.objectStore('drive_blobs').get(id);
        req.onsuccess = () => {
          resolve(req.result?.blob || null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function deleteDriveBlob(id: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains('drive_blobs')) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('drive_blobs', 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.objectStore('drive_blobs').delete(id);
      } catch {
        resolve();
      }
    });
  } catch {}
}
