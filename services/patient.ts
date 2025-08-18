import { db } from "@/lib/firebaseConfig";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

export interface PatientData {
  insuranceInfo?: string | null;
  dateOfBirth?: string | null; // ISO format: YYYY-MM-DD
  medicalHistory?: string[];
  appointments?: string[]; // store appointment IDs
}

export async function createPatient(uid: string, data: PatientData = {}) {
  await setDoc(doc(db, "patients", uid), {
    insuranceInfo: data.insuranceInfo ?? null,
    dateOfBirth: data.dateOfBirth ?? null,
    medicalHistory: data.medicalHistory ?? [],
    appointments: data.appointments ?? [],
  });
}

export async function updatePatient(uid: string, updates: Partial<PatientData>) {
  const ref = doc(db, "patients", uid);
  await updateDoc(ref, updates);
}

export async function getPatient(uid: string): Promise<PatientData | null> {
  const snapshot = await getDoc(doc(db, "patients", uid));
  if (snapshot.exists()) {
    return snapshot.data() as PatientData;
  }
  return null;
}
