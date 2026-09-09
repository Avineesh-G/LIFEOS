import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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

  return merged;
}

export async function getData(uid: string): Promise<AppData> {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return sanitizeAppData(snap.data() as Partial<AppData>);
  }
  return DEFAULT_DATA;
}

export async function saveData(uid: string, data: Partial<AppData>, existingData?: AppData): Promise<void> {
  const existing = existingData || await getData(uid).catch(() => DEFAULT_DATA);
  const merged = sanitizeAppData({ ...existing, ...data });
  const cleaned = cleanForFirestore(merged);
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, cleaned, { merge: true });
}

export async function exportData(uid: string): Promise<string> {
  const data = await getData(uid);
  return JSON.stringify(data, null, 2);
}

export async function importData(uid: string, json: string): Promise<void> {
  const data = JSON.parse(json) as AppData;
  await saveData(uid, data);
}

export async function clearAllData(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await deleteDoc(docRef);
}

export { DEFAULT_DATA };
