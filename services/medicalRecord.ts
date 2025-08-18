import { db } from "@/lib/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

export interface MedicalRecord {
	id?: string;
  title: string;
  date: string;
  imageUrls: string[];
  ocrText?: string;
	userUid: string;
}

export async function createMedicalRecord(record: MedicalRecord) {
  try {
    const docRef = await addDoc(collection(db, "medicalRecords"), {
      ...record,
    });
    return docRef.id;
  } catch (err) {
    console.error("Error creating medical record:", err);
    throw err;
  }
}
