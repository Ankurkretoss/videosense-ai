import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured — add the NEXT_PUBLIC_FIREBASE_* values to .env.local."
    );
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

let firestore: Firestore | null = null;

export function getDb(): Firestore {
  if (!firestore) {
    firestore = initializeFirestore(getFirebaseApp(), {
      // The SDK's long-polling auto-detection fires a probe request and then aborts
      // it, which surfaces as an unhandled AbortError in the browser. Long polling is
      // requested outright instead, so no probe is needed.
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    });
  }
  return firestore;
}
