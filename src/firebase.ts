import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDwyxGvvFlBNv2LLDZ6Jo22AY0sSNcIyuE",
  authDomain: "lifeos-f4de3.firebaseapp.com",
  projectId: "lifeos-f4de3",
  storageBucket: "lifeos-f4de3.firebasestorage.app",
  messagingSenderId: "527411007566",
  appId: "1:527411007566:web:7a85f483d2b5efeafdb31f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});
