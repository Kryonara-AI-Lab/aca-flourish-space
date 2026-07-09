import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

export type FirebaseProfile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  role?: string | null;
  plan?: string | null;
  honor_score?: number;
  current_streak?: number;
  longest_streak?: number;
  created_at?: string;
  updated_at?: string;
};

export type FirebaseMaterial = {
  id: string;
  user_id: string;
  title: string | null;
  subject: string | null;
  type: "notes" | "homework" | "exam";
  description: string | null;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  is_pinned: boolean;
  is_public: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FirebaseStudySet = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  subject: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type FirebaseAttempt = {
  id: string;
  user_id: string;
  score?: number;
  total?: number;
  completed_at?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type FirebaseAccountEvent = {
  id: string;
  user_id: string;
  event_type: string;
  detail: string | null;
  created_at: string;
  user_agent: string | null;
};

export type FirebaseUsageEvent = {
  id: string;
  user_id: string;
  kind: string;
  created_at: string;
};

export async function getCurrentFirebaseUser(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;

  return await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentFirebaseUser();
  return user?.uid ?? null;
}

export async function getUserProfile(uid: string): Promise<FirebaseProfile | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  const data = snap.exists() ? (snap.data() as Partial<FirebaseProfile> | undefined) : undefined;
  return data ? ({ id: snap.id, ...data } as FirebaseProfile) : null;
}

export async function getUserMaterials(uid: string): Promise<FirebaseMaterial[]> {
  const q = query(collection(db, "materials"), where("user_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<FirebaseMaterial, "id">),
  }));
}

export async function getUserStudySets(uid: string): Promise<FirebaseStudySet[]> {
  const q = query(collection(db, "study_sets"), where("user_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    user_id: String((docSnap.data().user_id as string | undefined) ?? ""),
    kind: String((docSnap.data().kind as string | undefined) ?? "study"),
    title: String((docSnap.data().title as string | undefined) ?? ""),
    subject: typeof docSnap.data().subject === "string" ? docSnap.data().subject : null,
    created_at: String((docSnap.data().created_at as string | undefined) ?? ""),
  }));
}

export async function getUserAttempts(uid: string): Promise<FirebaseAttempt[]> {
  const q = query(collection(db, "attempts"), where("user_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    user_id: String((docSnap.data().user_id as string | undefined) ?? ""),
    score: typeof docSnap.data().score === "number" ? docSnap.data().score : undefined,
    total: typeof docSnap.data().total === "number" ? docSnap.data().total : undefined,
    completed_at: typeof docSnap.data().completed_at === "string" ? docSnap.data().completed_at : undefined,
    created_at: typeof docSnap.data().created_at === "string" ? docSnap.data().created_at : undefined,
  }));
}

export async function getUserAccountEvents(uid: string): Promise<FirebaseAccountEvent[]> {
  const q = query(collection(db, "account_events"), where("user_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<FirebaseAccountEvent, "id">),
  }));
}

export async function getUserUsage(uid: string): Promise<FirebaseUsageEvent[]> {
  const q = query(collection(db, "ai_usage"), where("user_id", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<FirebaseUsageEvent, "id">),
  }));
}

export async function uploadMaterialToFirebase({
  uid,
  type,
  title,
  subject,
  file,
  description,
  isPublic = false,
}: {
  uid: string;
  type: "notes" | "homework" | "exam";
  title: string;
  subject: string;
  file: File;
  description?: string;
  isPublic?: boolean;
}) {
  const safe = file.name.replace(/[^\w.-]+/g, "_");
  const storagePath = `${uid}/${type}/${Date.now()}-${safe}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
  });

  const materialRef = doc(collection(db, "materials"));
  const payload = {
    id: materialRef.id,
    user_id: uid,
    title: title.trim().slice(0, 120),
    subject: subject.trim() || null,
    type,
    storage_path: storagePath,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || null,
    description: description?.trim() || null,
    is_public: isPublic,
    is_pinned: false,
    pinned_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await setDoc(materialRef, payload);
  return payload;
}

export async function updateMaterialField(materialId: string, patch: Record<string, unknown>) {
  await updateDoc(doc(db, "materials", materialId), patch);
}

export async function deleteMaterialFromFirebase(materialId: string, storagePath: string) {
  await deleteDoc(doc(db, "materials", materialId));
  await deleteObject(ref(storage, storagePath)).catch(() => undefined);
}

export async function saveProfile(uid: string, patch: Record<string, unknown>) {
  await setDoc(doc(db, "profiles", uid), { id: uid, ...patch }, { merge: true });
}

export async function logAccountEvent(uid: string, eventType: string, detail?: string) {
  const refDoc = await addDoc(collection(db, "account_events"), {
    user_id: uid,
    event_type: eventType,
    detail: detail ?? null,
    created_at: new Date().toISOString(),
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
  });
  return refDoc.id;
}

export async function addUsageEvent(uid: string, kind: string) {
  await addDoc(collection(db, "ai_usage"), {
    user_id: uid,
    kind,
    created_at: new Date().toISOString(),
  });
}

export async function getMaterialDownloadUrl(storagePath: string) {
  return await getDownloadURL(ref(storage, storagePath));
}
