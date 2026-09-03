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

export async function getData(uid: string): Promise<AppData> {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { ...DEFAULT_DATA, ...(snap.data() as Partial<AppData>) };
  }
  return DEFAULT_DATA;
}

export async function saveData(uid: string, data: Partial<AppData>): Promise<void> {
  const existing = await getData(uid).catch(() => DEFAULT_DATA);
  const merged = { ...existing, ...data };
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, merged, { merge: true });
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
