import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA2eOLsLd27ud7auKHpx8XrxKa9FEJlwjk",
  authDomain: "spoude.firebaseapp.com",
  projectId: "spoude",
  storageBucket: "spoude.firebasestorage.app",
  messagingSenderId: "546104486056",
  appId: "1:546104486056:web:164bf9ce774d8c8d5c3a9d",
  measurementId: "G-MB7BCVQXR3",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export { app, auth, db, storage };
export type { User };
