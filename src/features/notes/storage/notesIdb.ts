/**
 * LifeOS — Notes & Ideas Dedicated IndexedDB Storage
 * 
 * Manages local persistence for notes in IndexedDB store 'notes'
 * with fallback to localStorage.
 */

import { getIndexedDB } from '../../../utils/idbStorage';
import type { NoteItem } from '../../../types';

const STORE_NOTES = 'notes';
const FALLBACK_KEY = 'lifeos_notes_idb_cache';

export async function getAllNotesFromIdb(): Promise<NoteItem[]> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_NOTES)) {
      const fallback = localStorage.getItem(FALLBACK_KEY);
      return fallback ? (JSON.parse(fallback) as NoteItem[]) : [];
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readonly');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as NoteItem[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[LifeOS Notes IDB] Error loading notes:', err);
    try {
      const fallback = localStorage.getItem(FALLBACK_KEY);
      return fallback ? (JSON.parse(fallback) as NoteItem[]) : [];
    } catch {
      return [];
    }
  }
}

export async function putNoteInIdb(note: NoteItem): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_NOTES)) {
      const existing = await getAllNotesFromIdb();
      const updated = existing.filter((n) => n.id !== note.id).concat(note);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(updated));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[LifeOS Notes IDB] Error putting note:', err);
    try {
      const existing = await getAllNotesFromIdb();
      const updated = existing.filter((n) => n.id !== note.id).concat(note);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(updated));
    } catch {}
  }
}

export async function deleteNoteFromIdb(id: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_NOTES)) {
      const existing = await getAllNotesFromIdb();
      const updated = existing.filter((n) => n.id !== id);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(updated));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[LifeOS Notes IDB] Error deleting note:', err);
    try {
      const existing = await getAllNotesFromIdb();
      const updated = existing.filter((n) => n.id !== id);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(updated));
    } catch {}
  }
}

export async function bulkSyncNotesToIdb(notes: NoteItem[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_NOTES)) {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(notes));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      const store = tx.objectStore(STORE_NOTES);
      store.clear();
      for (const note of notes) {
        store.put(note);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[LifeOS Notes IDB] Error bulk syncing notes:', err);
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(notes));
    } catch {}
  }
}

export async function clearAllNotesIdb(): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (db && db.objectStoreNames.contains(STORE_NOTES)) {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      tx.objectStore(STORE_NOTES).clear();
    }
    localStorage.removeItem(FALLBACK_KEY);
  } catch {}
}
