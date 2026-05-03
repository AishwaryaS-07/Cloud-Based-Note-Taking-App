import { initializeApp, getApps } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { Timestamp, collection, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

let app = null;

if (hasFirebaseConfig) {
  app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          apiKey: firebaseConfig.apiKey!,
          authDomain: firebaseConfig.authDomain!,
          projectId: firebaseConfig.projectId!
        });
}

export const firebaseEnabled = Boolean(app);

export const auth = app ? getAuth(app) : null;
export const provider = app ? new GoogleAuthProvider() : null;
export const db = app ? getFirestore(app) : null;

export function toFirestoreShareExpiresAt(value: string | null) {
  return value ? Timestamp.fromDate(new Date(value)) : null;
}

export function fromFirestoreShareExpiresAt(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

export function notesCollection(uid: string) {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }
  return collection(db, `users/${uid}/notes`);
}
