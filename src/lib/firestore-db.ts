import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit as firestoreLimit,
  getDocs,
  addDoc,
} from "firebase/firestore";

// Profiles helpers
export async function getProfile(userId: string): Promise<Record<string, unknown>> {
  const ref = doc(db, "profiles", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return {
      id: userId,
      username: null,
      display_name: null,
      avatar_url: null,
      bio: null,
      plan: "free",
      honor_score: 0,
      current_streak: 0,
      longest_streak: 0,
    };
  }
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

export async function saveProfile(userId: string, data: Record<string, unknown>) {
  const ref = doc(db, "profiles", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id: userId,
      username: null,
      display_name: null,
      avatar_url: null,
      bio: null,
      plan: "free",
      honor_score: 0,
      current_streak: 0,
      longest_streak: 0,
      ...data,
      created_at: new Date().toISOString(),
    });
  } else {
    await updateDoc(ref, data);
  }
}

// Materials helpers
export async function getMaterials(
  userId: string,
  activeType: string,
): Promise<Record<string, unknown>[]> {
  const q = query(
    collection(db, "materials"),
    where("user_id", "==", userId),
    where("type", "==", activeType),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
  return list.sort((a, b) => {
    const aPinned = !!a.is_pinned;
    const bPinned = !!b.is_pinned;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const aTime = a.pinned_at ? new Date(a.pinned_at as string).getTime() : 0;
    const bTime = b.pinned_at ? new Date(b.pinned_at as string).getTime() : 0;
    if (aPinned && aTime !== bTime) return bTime - aTime;
    return (
      new Date((b.created_at as string) || 0).getTime() -
      new Date((a.created_at as string) || 0).getTime()
    );
  });
}

export async function addMaterial(data: Record<string, unknown>): Promise<string> {
  const ref = collection(db, "materials");
  const docRef = await addDoc(ref, {
    ...data,
    is_pinned: false,
    is_public: false,
    pinned_at: null,
    created_at: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateMaterial(materialId: string, data: Record<string, unknown>) {
  const ref = doc(db, "materials", materialId);
  await updateDoc(ref, data);
}

export async function deleteMaterial(materialId: string) {
  const ref = doc(db, "materials", materialId);
  await deleteDoc(ref);
}

// Study Sets helpers
export async function getStudySets(
  userId: string,
  kind?: string,
): Promise<Record<string, unknown>[]> {
  let q = query(collection(db, "study_sets"), where("user_id", "==", userId));
  if (kind) {
    q = query(q, where("kind", "==", kind));
  }
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
  return list.sort(
    (a, b) =>
      new Date((b.created_at as string) || 0).getTime() -
      new Date((a.created_at as string) || 0).getTime(),
  );
}

export async function getStudySet(id: string): Promise<Record<string, unknown> | null> {
  const ref = doc(db, "study_sets", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

export async function addStudySet(data: Record<string, unknown>): Promise<string> {
  const ref = collection(db, "study_sets");
  const docRef = await addDoc(ref, {
    ...data,
    created_at: new Date().toISOString(),
  });
  return docRef.id;
}

export async function deleteStudySet(id: string) {
  const ref = doc(db, "study_sets", id);
  await deleteDoc(ref);
}

// Attempts helpers
export async function getAttempts(
  userId: string,
  maxLimit = 10,
): Promise<Record<string, unknown>[]> {
  const q = query(
    collection(db, "attempts"),
    where("user_id", "==", userId),
    firestoreLimit(maxLimit),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
  return list.sort(
    (a, b) =>
      new Date((b.completed_at as string) || 0).getTime() -
      new Date((a.completed_at as string) || 0).getTime(),
  );
}

export async function addAttempt(data: Record<string, unknown>) {
  const ref = collection(db, "attempts");
  await addDoc(ref, {
    ...data,
    completed_at: new Date().toISOString(),
  });
}

// Account Events helpers
export async function getAccountEvents(
  userId: string,
  maxLimit = 15,
): Promise<Record<string, unknown>[]> {
  const q = query(
    collection(db, "account_events"),
    where("user_id", "==", userId),
    firestoreLimit(maxLimit),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
  return list.sort(
    (a, b) =>
      new Date((b.created_at as string) || 0).getTime() -
      new Date((a.created_at as string) || 0).getTime(),
  );
}

export async function addAccountEvent(
  userId: string,
  event_type: string,
  detail: string | null,
  userAgent: string,
) {
  const ref = collection(db, "account_events");
  await addDoc(ref, {
    user_id: userId,
    event_type,
    detail,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  });
}

// Counts helpers for profile
export async function getProfileCounts(userId: string) {
  const [matsSnap, setsSnap, attsSnap, postsSnap] = await Promise.all([
    getDocs(query(collection(db, "materials"), where("user_id", "==", userId))),
    getDocs(query(collection(db, "study_sets"), where("user_id", "==", userId))),
    getDocs(query(collection(db, "attempts"), where("user_id", "==", userId))),
    getDocs(query(collection(db, "posts"), where("user_id", "==", userId))),
  ]);
  return {
    materials: matsSnap.size,
    sets: setsSnap.size,
    attempts: attsSnap.size,
    posts: postsSnap.size,
  };
}
