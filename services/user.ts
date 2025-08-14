import { db } from "@/firebaseConfig";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

export interface UserData {
  name: string;
  email: string;
  role: "patient" | "doctor" | "nurse" | string;
  createdAt: number;
}

export async function createUser(uid: string, name: string, email: string) {
  await setDoc(doc(db, "users", uid), {
    name,
    email,
    role: "patient",
    createdAt: Date.now(),
  });

  await setDoc(doc(db, "patients", uid), {
    insuranceInfo: null,
    dateOfBirth: null,
  });
}

export async function updateUser(uid: string, updates: Partial<UserData>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, updates);
}

export async function getUser(uid: string): Promise<UserData | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (snapshot.exists()) {
    return snapshot.data() as UserData;
  }
  return null;
}