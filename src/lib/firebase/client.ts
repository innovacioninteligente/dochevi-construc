
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Initialize Firebase only on the client side and if config is valid
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Functions to get instances, ensures they are only called client-side
const getSafeAuth = (): Auth => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Make sure you are on the client-side and your Firebase config is correct.");
  }
  return auth;
}

const getSafeDb = (): Firestore => {
  if (!db) {
    throw new Error("Firestore is not initialized. Make sure you are on the client-side and your Firebase config is correct.");
  }
  return db;
}

// Initialize Storage
import { getStorage, type FirebaseStorage } from 'firebase/storage';
let storage: FirebaseStorage | null = null;
if (app) {
  storage = getStorage(app);
}

const getSafeStorage = (): FirebaseStorage => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  return storage;
}

export { app, getSafeAuth, getSafeDb, getSafeStorage };
