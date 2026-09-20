/**
 * LifeOS — Outing Expenses IndexedDB Storage
 * 
 * Manages all dedicated 'outing_*' object stores:
 * - outing_outings
 * - outing_people
 * - outing_expenses
 * - outing_settlements
 * - outing_receipts (stores binary blobs locally)
 */

import { getIndexedDB } from '../../../utils/idbStorage';
import { DEFAULT_ME_PERSON } from '../constants';
import type {
  Outing,
  OutingPerson,
  OutingExpense,
  OutingSettlement,
  OutingReceiptRecord,
} from '../types';

const STORE_OUTINGS = 'outing_outings';
const STORE_PEOPLE = 'outing_people';
const STORE_EXPENSES = 'outing_expenses';
const STORE_SETTLEMENTS = 'outing_settlements';
const STORE_RECEIPTS = 'outing_receipts';

// Generic helper to get all items from a store
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(storeName)) {
      const fallback = localStorage.getItem(`lifeos_${storeName}`);
      return fallback ? (JSON.parse(fallback) as T[]) : [];
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LifeOS Outings IDB] Error getting all from ${storeName}:`, err);
    try {
      const fallback = localStorage.getItem(`lifeos_${storeName}`);
      return fallback ? (JSON.parse(fallback) as T[]) : [];
    } catch {
      return [];
    }
  }
}

// Generic helper to put item into a store
async function putInStore<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(storeName)) {
      const all = await getAllFromStore<T>(storeName);
      const index = all.findIndex((i) => i.id === item.id);
      if (index >= 0) all[index] = item;
      else all.push(item);
      localStorage.setItem(`lifeos_${storeName}`, JSON.stringify(all));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LifeOS Outings IDB] Error putting item in ${storeName}:`, err);
  }
}

// Generic helper to delete item from a store
async function deleteFromStore(storeName: string, id: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(storeName)) {
      const all = await getAllFromStore<{ id: string }>(storeName);
      const filtered = all.filter((i) => i.id !== id);
      localStorage.setItem(`lifeos_${storeName}`, JSON.stringify(filtered));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LifeOS Outings IDB] Error deleting item from ${storeName}:`, err);
  }
}

// --- Outings ---
export async function getOutings(): Promise<Outing[]> {
  const all = await getAllFromStore<Outing>(STORE_OUTINGS);
  return all.filter((o) => !o.deletedAt);
}

export async function getOutingById(id: string): Promise<Outing | null> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_OUTINGS)) {
      const all = await getOutings();
      return all.find((o) => o.id === id) || null;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_OUTINGS, 'readonly');
      const store = tx.objectStore(STORE_OUTINGS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveOuting(outing: Outing): Promise<void> {
  await putInStore(STORE_OUTINGS, outing);
}

export async function deleteOuting(id: string, permanent: boolean = false): Promise<void> {
  if (permanent) {
    await deleteFromStore(STORE_OUTINGS, id);
    // Also delete associated expenses, settlements, and receipts
    const expenses = await getExpensesByOuting(id);
    for (const exp of expenses) {
      await deleteFromStore(STORE_EXPENSES, exp.id);
    }
    const settlements = await getSettlementsByOuting(id);
    for (const set of settlements) {
      await deleteFromStore(STORE_SETTLEMENTS, set.id);
    }
    const receipts = await getReceiptRecordsByOuting(id);
    for (const r of receipts) {
      await deleteFromStore(STORE_RECEIPTS, r.id);
    }
  } else {
    // Soft delete
    const outing = await getOutingById(id);
    if (outing) {
      outing.deletedAt = new Date().toISOString();
      await saveOuting(outing);
    }
  }
}

export async function restoreOuting(id: string): Promise<void> {
  const outing = await getOutingById(id);
  if (outing) {
    outing.deletedAt = null;
    await saveOuting(outing);
  }
}

// --- People ---
export async function getPeople(): Promise<OutingPerson[]> {
  const all = await getAllFromStore<OutingPerson>(STORE_PEOPLE);
  if (!all.some((p) => p.isMe || p.id === 'me')) {
    await savePerson(DEFAULT_ME_PERSON);
    return [DEFAULT_ME_PERSON, ...all];
  }
  return all;
}

export async function savePerson(person: OutingPerson): Promise<void> {
  await putInStore(STORE_PEOPLE, person);
}

export async function ensureMePerson(): Promise<OutingPerson> {
  const people = await getPeople();
  const me = people.find((p) => p.isMe || p.id === 'me');
  if (me) return me;
  await savePerson(DEFAULT_ME_PERSON);
  return DEFAULT_ME_PERSON;
}

// --- Expenses ---
export async function getExpensesByOuting(outingId: string): Promise<OutingExpense[]> {
  const all = await getAllFromStore<OutingExpense>(STORE_EXPENSES);
  return all.filter((e) => e.outingId === outingId && !e.deletedAt);
}

export async function saveExpense(expense: OutingExpense): Promise<void> {
  await putInStore(STORE_EXPENSES, expense);
}

export async function deleteExpense(id: string, permanent: boolean = false): Promise<void> {
  if (permanent) {
    await deleteFromStore(STORE_EXPENSES, id);
  } else {
    const all = await getAllFromStore<OutingExpense>(STORE_EXPENSES);
    const exp = all.find((e) => e.id === id);
    if (exp) {
      exp.deletedAt = new Date().toISOString();
      await saveExpense(exp);
    }
  }
}

export async function restoreExpense(id: string): Promise<void> {
  const all = await getAllFromStore<OutingExpense>(STORE_EXPENSES);
  const exp = all.find((e) => e.id === id);
  if (exp) {
    exp.deletedAt = null;
    await saveExpense(exp);
  }
}

// --- Settlements ---
export async function getSettlementsByOuting(outingId: string): Promise<OutingSettlement[]> {
  const all = await getAllFromStore<OutingSettlement>(STORE_SETTLEMENTS);
  return all.filter((s) => s.outingId === outingId && !s.deletedAt);
}

export async function saveSettlement(settlement: OutingSettlement): Promise<void> {
  await putInStore(STORE_SETTLEMENTS, settlement);
}

export async function deleteSettlement(id: string): Promise<void> {
  await deleteFromStore(STORE_SETTLEMENTS, id);
}

// --- Receipts ---
export async function saveReceiptRecord(record: OutingReceiptRecord): Promise<void> {
  await putInStore(STORE_RECEIPTS, record);
}

export async function getReceiptRecord(id: string): Promise<OutingReceiptRecord | null> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_RECEIPTS)) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readonly');
      const store = tx.objectStore(STORE_RECEIPTS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getReceiptRecordsByOuting(outingId: string): Promise<OutingReceiptRecord[]> {
  const all = await getAllFromStore<OutingReceiptRecord>(STORE_RECEIPTS);
  return all.filter((r) => r.outingId === outingId);
}

export async function deleteReceiptRecord(id: string): Promise<void> {
  await deleteFromStore(STORE_RECEIPTS, id);
}

export async function getReceiptsStorageSize(): Promise<number> {
  try {
    const all = await getAllFromStore<OutingReceiptRecord>(STORE_RECEIPTS);
    return all.reduce((acc, r) => acc + (r.size || 0), 0);
  } catch {
    return 0;
  }
}

export async function clearAllReceiptBlobs(): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db || !db.objectStoreNames.contains(STORE_RECEIPTS)) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readwrite');
      const store = tx.objectStore(STORE_RECEIPTS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[LifeOS IDB] Error clearing receipt blobs:', err);
  }
}
