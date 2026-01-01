import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (typeof window !== 'undefined') {
  console.log("Firebase Config DEBUG:", JSON.stringify({
    apiKey: firebaseConfig.apiKey ? "PRESENT" : "MISSING",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId
  }, null, 2));
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Use initializeFirestore to enable long polling
// Adding a check to avoid re-initialization error if already initialized
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  console.log("Firestore initialized with Long Polling");
} catch (e) {
  db = getFirestore(app);
  console.log("Firestore was already initialized, using existing instance");
}

const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
