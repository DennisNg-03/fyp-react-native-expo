// import { db } from "@/lib/firebaseConfig";
// import { addDoc, collection } from "firebase/firestore";
// import { supabase } from '@/lib/supabase';

// export interface MedicalRecord {
// 	id?: string;
//   title: string;
//   date: string;
//   imageUrls: string[];
//   ocrText?: string;
// 	userUid: string;
// }

// export async function createMedicalRecord(record: MedicalRecord) {
//   try {
//     const docRef = await addDoc(collection(db, "medicalRecords"), {
//       ...record,
//     });
//     return docRef.id;
//   } catch (err) {
//     console.error("Error creating medical record:", err);
//     throw err;
//   }
// }


// export async function fetchUserRecords(uid: string, token: string) {
//   const { data, error } = await supabase
//     .from('medical_records')
//     .select('id, file_paths, title, date')
//     .eq('user_id', uid)

//   if (error) throw error;
//   return data;
// }

// // Then call Edge Function
// export async function fetchSignedUrls(filePaths: string[]) {
//   const res = await fetch('EDGE_FUNCTION_URL', {
//     method: 'POST',
//     body: JSON.stringify({ filePaths }),
//   });
//   const json = await res.json();
//   return json.signedUrls;
// }

