import { doc, getDoc, getDocFromServer, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppData } from './types';

const DEFAULT_DATA: AppData = {
  studySessions: [],
  workoutPlans: [
    { day: 'Mon', type: 'PUSH', exercises: [] },
    { day: 'Tue', type: 'PULL', exercises: [] },
    { day: 'Wed', type: 'CORE', exercises: [] },
    { day: 'Thu', type: 'PUSH', exercises: [] },
    { day: 'Fri', type: 'PULL', exercises: [] },
    { day: 'Sat', type: 'SHOULDERS', exercises: [] },
    { day: 'Sun', type: 'REST', exercises: [] },
  ],
  workoutLogs: [],
  expenses: [],
  timetable: [],
  tasks: [],
  reviews: [],
  settings: { theme: 'system', accentColor: '#6366F1' },
  profile: null,
  menuMonths: [],
  nutritionLogs: [],
  messPreference: 'nonveg',
  geminiApiKey: '',
  vaultItems: [],
  vaultConfig: null,
  laundryBatches: [],
  shoppingLists: [],
};

function cleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const res: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      res[key] = cleanForFirestore(val);
    }
  }
  return res;
}

export function sanitizeAppData(raw: Partial<AppData> | null | undefined): AppData {
  if (!raw) return DEFAULT_DATA;
  const merged = { ...DEFAULT_DATA, ...raw };

  merged.workoutLogs = (merged.workoutLogs || []).map(w => ({
    ...w,
    exercises: (w?.exercises || []).map(ex => ({
      name: ex?.name || 'Exercise',
      howTo: ex?.howTo || '',
      rest: ex?.rest || '',
      sets: Array.isArray(ex?.sets)
        ? ex.sets.map(s => ({
            reps: Number(s?.reps) || 0,
            weight: Number(s?.weight) || 0,
            completed: Boolean(s?.completed),
          }))
        : []
    }))
  }));

  merged.workoutPlans = (merged.workoutPlans || []).map(p => ({
    ...p,
    exercises: (p?.exercises || []).map(ex => ({
      ...ex,
      sets: Number(ex?.sets) || 3,
      reps: Number(ex?.reps) || 10,
      weight: Number(ex?.weight) || 0,
    }))
  }));

  merged.expenses = merged.expenses || [];
  merged.studySessions = merged.studySessions || [];
  merged.timetable = merged.timetable || [];
  merged.tasks = merged.tasks || [];
  merged.reviews = merged.reviews || [];
  merged.nutritionLogs = merged.nutritionLogs || [];
  merged.menuMonths = merged.menuMonths || [];
  merged.vaultItems = (merged.vaultItems || []).map(v => ({
    id: v?.id || `vault_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: v?.title || 'Untitled',
    category: v?.category || 'personal',
    usernameOrEmail: v?.usernameOrEmail || '',
    encryptedPassword: v?.encryptedPassword || '',
    iv: v?.iv || '',
    websiteUrl: v?.websiteUrl || '',
    notes: v?.notes || '',
    createdAt: v?.createdAt || new Date().toISOString(),
    updatedAt: v?.updatedAt || new Date().toISOString(),
  }));
  merged.vaultConfig = merged.vaultConfig || null;
  merged.laundryBatches = merged.laundryBatches || [];
  merged.shoppingLists = (merged.shoppingLists || []).map(list => ({
    id: list?.id || `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: list?.name || 'Untitled List',
    createdAt: list?.createdAt || new Date().toISOString(),
    updatedAt: list?.updatedAt || new Date().toISOString(),
    isTemplate: Boolean(list?.isTemplate),
    category: list?.category || undefined,
    items: Array.isArray(list?.items)
      ? list.items.map(item => ({
          id: item?.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: item?.name || '',
          quantity: item?.quantity || undefined,
          checked: Boolean(item?.checked),
          notes: item?.notes || undefined,
        }))
      : [],
  }));

  return merged;
}

export async function getData(uid: string, forceServer: boolean = false): Promise<AppData> {
  const docRef = doc(db, 'users', uid);
  let snap;
  if (forceServer) {
    try {
      snap = await getDocFromServer(docRef);
    } catch {
      snap = await getDoc(docRef);
    }
  } else {
    snap = await getDoc(docRef);
  }
  if (snap.exists()) {
    return sanitizeAppData(snap.data() as Partial<AppData>);
  }
  return DEFAULT_DATA;
}

export async function saveData(uid: string, data: Partial<AppData>): Promise<void> {
  const cleaned = cleanForFirestore(data);
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, cleaned, { merge: true });
}

export async function exportData(uid: string): Promise<string> {
  const data = await getData(uid);
  return JSON.stringify(data, null, 2);
}

export const DATA_SCHEMA_VERSION = 2;

export function migrateAppData(data: any): AppData {
  if (!data || typeof data !== 'object') return DEFAULT_DATA;
  const version = typeof data._schemaVersion === 'number' ? data._schemaVersion : 1;
  const migrated = { ...data };

  // Migrations for schema evolution
  if (version < 2) {
    migrated._schemaVersion = 2;
    if (!Array.isArray(migrated.shoppingLists)) migrated.shoppingLists = [];
    if (!Array.isArray(migrated.vaultItems)) migrated.vaultItems = [];
    if (!Array.isArray(migrated.laundryBatches)) migrated.laundryBatches = [];
  }

  return sanitizeAppData(migrated);
}

export async function importData(uid: string, json: string): Promise<void> {
  try {
    const raw = JSON.parse(json);
    const migrated = migrateAppData(raw);
    await saveData(uid, migrated);
  } catch (e) {
    console.error('[LifeOS] Failed to parse or import data JSON:', e);
    throw new Error('Invalid JSON backup file.');
  }
}

export async function clearAllData(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await deleteDoc(docRef);
}

export { DEFAULT_DATA };
