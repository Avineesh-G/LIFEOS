/**
 * LifeOS — Outing Expenses Firestore Cloud Synchronization
 * 
 * Separate collection path: `users/${uid}/outings_data/${collectionName}`
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
} from './outingsIdb';
import type { Outing, OutingPerson, OutingExpense, OutingSettlement } from '../types';

interface OutingCloudData {
  outings: Outing[];
  people: OutingPerson[];
  expenses: OutingExpense[];
  settlements: OutingSettlement[];
  updatedAt: string;
}

export async function syncOutingsWithCloud(uid: string): Promise<void> {
  if (!uid) return;

  try {
    const docRef = doc(db, 'users', uid, 'outings_data', 'bundle');
    const snap = await getDoc(docRef);

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

    if (snap.exists()) {
      const cloudData = snap.data() as Partial<OutingCloudData>;

      // Merge cloud into local
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
    }

    // Push combined back to cloud
    const payload: OutingCloudData = {
      outings: await getOutings(),
      people: await getPeople(),
      expenses: allLocalExpenses,
      settlements: allLocalSettlements,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('[LifeOS Outings Sync] Cloud sync skipped or offline:', err);
  }
}
