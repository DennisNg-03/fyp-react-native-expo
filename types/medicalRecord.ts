export type SelectedFile = {
	uri: string; // This attribute can be the local URI for Expo image picker preview or Database's file path
	name: string;
	type: string; // Expect to be MIME type 
};

export type SelectedFileToUpload = {
	name: string;
	blobBase64: string;
	type: string; // MIME type
}

export type RecordType = "Lab Result" | "Prescription" | "Imaging Report" | "Discharge Summary" | "Others";

export const recordTypes: RecordType[] = [
  "Lab Result",
  "Prescription",
  "Imaging Report",
  "Discharge Summary",
  "Others",
];

export interface BaseMedicalRecord {
  id: string;
  patient_id: string;
  title: string;
	record_type?: string,
  // date: string;
  file_paths: SelectedFile[]; // This is only used on frontend display and must be generated on backend, so it will not be in the payload sent to backend
  signed_urls: string[];
  updated_at?: string;
}

export interface AdditionalMedicalRecord {
	record_date?: string; // ISO date string
  patient_name?: string;
  date_of_birth?: string; // ISO date string (yyyy-mm-dd)
  age?: string;
  gender?: string;
  blood_type?: string;
  address?: string;
  doctor_name?: string;
  healthcare_provider_name?: string;
  healthcare_provider_address?: string;
  diagnosis?: string[];
  procedures?: string[];
  medications?: string[];
  date_of_admission?: string; // ISO date string
  date_of_discharge?: string; // ISO date string
  report_prepared_by?: string;
	notes?: string;
}

export type MedicalRecord = BaseMedicalRecord & Partial<AdditionalMedicalRecord>;

export const CompulsoryFields = [
	"record_date",
] as const;

export const PatientFields = [
  "patient_name",
  "date_of_birth",
  "age",
  "gender",
  "blood_type",
  "address",
] as const;

export const ProviderFields = [
  "doctor_name",
  "healthcare_provider_name",
  "healthcare_provider_address",
] as const;

export const RecordFields = [
  "diagnosis",
  "procedures",
  "medications",
  "date_of_admission",
  "date_of_discharge",
  "report_prepared_by",
	"notes",
] as const;

export const AdditionalMedicalRecordFields = [
	...CompulsoryFields,
  ...PatientFields,
  ...ProviderFields,
  ...RecordFields,
] as const;

export type AdditionalMedicalRecordField = (typeof AdditionalMedicalRecordFields)[number];


// export interface LabResultsRecord extends BaseMedicalRecord {
//   record_type: "Lab Results";
//   details: LabResult[];
// }

// export interface PrescriptionRecord extends BaseMedicalRecord {
//   record_type: "Prescriptions";
//   details: Prescription[];
// }

// export interface ImagingReportRecord extends BaseMedicalRecord {
//   record_type: "Imaging Reports";
//   details: ImagingReport[];
// }

// export interface DischargeSummaryRecord extends BaseMedicalRecord {
//   record_type: "Discharge Summary";
//   details: DischargeSummary[];
// }

// export type MedicalRecord =
//   | LabResultsRecord
//   | PrescriptionRecord
//   | ImagingReportRecord
// 	| DischargeSummaryRecord
// 	| BaseMedicalRecord;

// // export interface LabResult {
// // 	id: string;
// // 	record_id: string;
// // 	test_name: string;
// // 	result_value?: string;
// // 	unit?: string;
// // 	reference_range?: string;
// // 	confidence?: number;
// // }

// // export interface Prescription {
// //   id: string;
// //   record_id: string;
// //   medicine_name: string;
// //   dosage?: string;
// //   frequency?: string;
// //   duration?: string;
// //   notes?: string;
// // }
 
// // export interface ImagingReport {
// // 	id: string;
// // 	record_id: string;
// // 	modality: string;
// // 	body_part: string;
// // 	findings: string;
// // 	impression?: string;
// // 	notes?: string
// // }

// // export interface DischargeSummary {
// // 	id: string;
// // 	record_id: string;
// // 	admission_date?: string;  // When the patient was admitted
// //   discharge_date?: string;  // When the patient was discharged
// //   admitting_diagnosis?: string;   // Initial diagnosis/reason for admission
// //   final_diagnosis?: string;       // Diagnosis on discharge
// //   procedures?: string[];          // List of surgeries/procedures done
// //   hospital_course?: string;       // Summary of what happened during stay
// //   condition_at_discharge?: string; // "Stable", "Improved", etc.
// //   medications?: Prescription[];   // Can reuse Prescription type for discharge meds
// //   follow_up_instructions?: string; // Free text instructions
// //   follow_up_date?: string;        // Suggested follow-up appointment date
// //   notes?: string;  
// // }

export const LabResultFields = [
  "id",
  "record_id",
  "test_name",
  "result_value",
  "unit",
  "reference_range",
  "confidence",
] as const;

export const PrescriptionFields = [
  "id",
  "record_id",
  "medicine_name",
  "dosage",
  "frequency",
  "duration",
  "notes",
] as const;

export const ImagingReportFields = [
  "id",
  "record_id",
  "modality",
  "body_part",
  "findings",
  "impression",
  "notes",
] as const;

export const DischargeSummaryFields = [
  "id",
  "record_id",
  "admission_date",
  "discharge_date",
  "admitting_diagnosis",
  "final_diagnosis",
  "procedures",
  "hospital_course",
  "condition_at_discharge",
  "medications",
  "follow_up_instructions",
  "follow_up_date",
  "notes",
] as const;


export type LabResultField = (typeof LabResultFields)[number];
export type PrescriptionField = (typeof PrescriptionFields)[number];
export type ImagingReportField = (typeof ImagingReportFields)[number];
export type DischargeSummaryField = (typeof DischargeSummaryFields)[number];