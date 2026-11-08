/**
 * LifeOS — Outing Expenses Firestore Cloud Synchronization
 * 
 * Separate collection path: users//outings_data/
 * Purely synchronizes JSON metadata (outings, people, expenses, settlements).
 * Binary receipt image blobs remain strictly local in IndexedDB.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  getOutings,
  getPeople,
  saveOuting,
  savePerson,
  saveExpense,
  saveSettlement,
  getExpensesByOuting,
  getSettlementsByOuting,
  clearAllOutingsData,
  ensureMePerson,
} from './outingsIdb';
import type { Outing, OutingPerson, OutingExpense, OutingSettlement } from '../types';

interface OutingCloudData {
  outings: Outing[];
  people: OutingPerson[];
  expenses: OutingExpense[];
  settlements: OutingSettlement[];
  updatedAt: string;
}

const ACTIVE_USER_KEY = 'lifeos_active_outings_uid';

/**
 * Downloads cloud outings state for the current authenticated user.
 * Guarantees zero cross-contamination by checking account ownership.
 */
export async function syncOutingsWithCloud(uid: string): Promise<void> {
  if (!uid) return;

  try {
    const activeUid = localStorage.getItem(ACTIVE_USER_KEY);
    if (activeUid && activeUid !== uid) {
      console.log('[LifeOS Outings Sync] User account changed from', activeUid, 'to', uid, '— wiping stale local outings.');
      await clearAllOutingsData();
    }
    localStorage.setItem(ACTIVE_USER_KEY, uid);

    const docRef = doc(db, 'users', uid, 'outings_data', 'bundle');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cloudData = snap.data() as Partial<OutingCloudData>;

      // Cleanly replace local store with the cloud data for THIS user
      await clearAllOutingsData();
      localStorage.setItem(ACTIVE_USER_KEY, uid);

      if (Array.isArray(cloudData.people)) {
        for (const p of cloudData.people) {
          await savePerson(p);
        }
      }
      if (Array.isArray(cloudData.outings)) {
        for (const o of cloudData.outings) {
          await saveOuting(o);
        }
      }
      if (Array.isArray(cloudData.expenses)) {
        for (const e of cloudData.expenses) {
          await saveExpense(e);
        }
      }
      if (Array.isArray(cloudData.settlements)) {
        for (const s of cloudData.settlements) {
          await saveSettlement(s);
        }
      }
    } else {
      // Document does not exist in cloud yet: ensure pristine local state
      await clearAllOutingsData();
      localStorage.setItem(ACTIVE_USER_KEY, uid);
      await ensureMePerson();
      
      const payload: OutingCloudData = {
        outings: [],
        people: await getPeople(),
        expenses: [],
        settlements: [],
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, payload, { merge: true });
    }
  } catch (err) {
    console.warn('[LifeOS Outings Sync] Cloud sync skipped or offline:', err);
  }
}

/**
 * Pushes local outing modifications to cloud Firestore for the active user.
 */
export async function pushOutingsToCloud(uid: string): Promise<void> {
  if (!uid) return;

  try {
    const activeUid = localStorage.getItem(ACTIVE_USER_KEY);
    if (activeUid !== uid) {
      console.warn('[LifeOS Outings Sync] Push aborted: active outings user mismatch!');
      return;
    }

    const localOutings = await getOutings();
    const localPeople = await getPeople();
    const allLocalExpenses: OutingExpense[] = [];
    const allLocalSettlements: OutingSettlement[] = [];

    for (const o of localOutings) {
      const exps = await getExpensesByOuting(o.id);
      allLocalExpenses.push(...exps);
      const sets = await getSettlementsByOuting(o.id);
      allLocalSettlements.push(...sets);
    }

    const docRef = doc(db, 'users', uid, 'outings_data', 'bundle');
    const payload: OutingCloudData = {
      outings: localOutings,
      people: localPeople,
      expenses: allLocalExpenses,
      settlements: allLocalSettlements,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('[LifeOS Outings Sync] Push outings error:', err);
  }
}
