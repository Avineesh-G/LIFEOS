import type { AppData, StudySession, WorkoutPlan, WorkoutLog, Expense, TimetableBlock, Task, DayReview, AppSettings } from './types';

const DB_NAME = 'LifeOSDB';
const DB_VERSION = 1;

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
  // Profile & Nutrition
  profile: null,
  menuMonths: [],
  nutritionLogs: [],
  messPreference: 'nonveg',
  geminiApiKey: '',
};

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

export async function getData(): Promise<AppData> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'users', user.uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { ...DEFAULT_DATA, ...(snap.data() as Partial<AppData>) };
  }
  return DEFAULT_DATA;
}

export async function saveData(data: Partial<AppData>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const existing = await getData().catch(() => DEFAULT_DATA);
  const merged = { ...existing, ...data };
  
  const docRef = doc(db, 'users', user.uid);
  await setDoc(docRef, merged, { merge: true });
}

export async function exportData(): Promise<string> {
  const data = await getData();
  return JSON.stringify(data, null, 2);
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json) as AppData;
  await saveData(data);
}

export async function clearAllData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'users', user.uid);
  await deleteDoc(docRef);
}

export { DEFAULT_DATA };
