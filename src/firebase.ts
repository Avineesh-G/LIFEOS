import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || (typeof process !== 'undefined' && process.env) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'lifeos-app.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'lifeos-app',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'lifeos-app.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef'
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicit 100MB Firestore cache cap to keep mobile storage ultra-lean & fast
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ cacheSizeBytes: 100 * 1024 * 1024 }),
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
