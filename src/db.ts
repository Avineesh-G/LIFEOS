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

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
  });
}

export async function getData(): Promise<AppData> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const store = tx.objectStore('data');
    const req = store.get('appData');
    req.onsuccess = () => {
      const data = req.result;
      resolve(data ? { ...DEFAULT_DATA, ...data } : DEFAULT_DATA);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveData(data: Partial<AppData>): Promise<void> {
  const db = await openDB();
  const existing = await getData();
  const merged = { ...existing, ...data };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const store = tx.objectStore('data');
    const req = store.put(merged, 'appData');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const store = tx.objectStore('data');
    const req = store.delete('appData');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export { DEFAULT_DATA };
