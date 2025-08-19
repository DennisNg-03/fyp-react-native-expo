export type RecordType = "Lab Results" | "Prescriptions" | "Imaging Reports" | "Discharge Summary" | "Others";

export interface BaseMedicalRecord {
  id: string;
  user_id: string;
  title: string;
  date: string;
  file_paths: string[];
  signed_urls: string[];
  ocr_text?: string;
  updated_at?: string;
}

export interface LabResultsRecord extends BaseMedicalRecord {
  record_type: "Lab Results";
  details: LabResult[];
}

export interface PrescriptionRecord extends BaseMedicalRecord {
  record_type: "Prescriptions";
  details: Prescription[];
}

export interface ImagingReportRecord extends BaseMedicalRecord {
  record_type: "Imaging Reports";
  details: ImagingReport[];
}

export interface DischargeSummaryRecord extends BaseMedicalRecord {
  record_type: "Discharge Summary";
  details: DischargeSummary[];
}

export type MedicalRecord =
  | LabResultsRecord
  | PrescriptionRecord
  | ImagingReportRecord
	| DischargeSummaryRecord
	| BaseMedicalRecord;

export interface LabResult {
	id: string;
	record_id: string;
	test_name: string;
	result_value?: string;
	unit?: string;
	reference_range?: string;
	confidence?: number;
}

export interface Prescription {
  id: string;
  record_id: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}
 
export interface ImagingReport {
	id: string;
	record_id: string;
	modality: string;
	body_part: string;
	findings: string;
	impression?: string;
	notes?: string
}

export interface DischargeSummary {
	id: string;
	record_id: string;
	admission_date?: string;  // When the patient was admitted
  discharge_date?: string;  // When the patient was discharged
  admitting_diagnosis?: string;   // Initial diagnosis/reason for admission
  final_diagnosis?: string;       // Diagnosis on discharge
  procedures?: string[];          // List of surgeries/procedures done
  hospital_course?: string;       // Summary of what happened during stay
  condition_at_discharge?: string; // "Stable", "Improved", etc.
  medications?: Prescription[];   // Can reuse Prescription type for discharge meds
  follow_up_instructions?: string; // Free text instructions
  follow_up_date?: string;        // Suggested follow-up appointment date
  notes?: string;  
}
