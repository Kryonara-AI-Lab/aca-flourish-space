import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

let app: App | null = null;
if (getApps().length === 0 && projectId && clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: "spoude.firebasestorage.app",
  });
} else if (getApps().length > 0) {
  app = getApps()[0];
}

const adminAuth = app ? getAuth(app) : null;
const adminDb = app ? getFirestore(app) : null;
const adminStorage = app ? getStorage(app) : null;

export { adminAuth, adminDb, adminStorage };
