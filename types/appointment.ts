export type Appointment = {
	id: string;
	doctor_id: string;
	patient_id: string;
	starts_at: string; // timestamptz
	ends_at: string; // timestamptz
	status?: AppointmentStatus; // Make it optional since it is not needed when inserting
	reason: string;
	notes?: string;
	for_whom: "me" | "someone_else";
	other_person?: OtherPerson;
	supporting_documents?: SupportingDocument[] | IncomingFile[];
	new_documents?: SupportingDocument[] | IncomingFile[];
	removed_documents?: SupportingDocument[]; // To be sent to backend for deletion
	created_at?: string;
	updated_at?: string;
	// Flattened doctor and provider
	doctor?: {
		// doctor is an alias given to the join result
		full_name: string;
		email?: string;
		phone_number?: string;
		speciality: string;
		slot_minutes?: string;
	};
	provider?: {
		// provider is an alias given to the join result
		name: string;
		provider_type: string;
		address?: string;
		phone_number?: string;
	};
};

export type AppointmentStatus =
	| "pending" // appointment requested but not yet approved
	| "scheduled" // approved and upcoming
	| "rescheduling" // patient requested new time
	| "rescheduled" // appointment successfully moved to new time
	| "cancelled" // cancelled by patient or doctor
	| "completed" // appointment done
	| "no_show"; // patient didn't attend

export type IncomingFile = {
	name: string;
	blobBase64: string;
	type: string;
	document_type: string;
};

export type OtherPerson = {
	name: string;
	date_of_birth: string | Date;
	gender: string;
	relationship: string;
};

export type Slot = {
	slot_start: string;
	slot_end: string;
	is_blocked: boolean;
};

// SupportingDocument[]  is only used on frontend display and must be generated on backend, so it will not be in the payload sent to backend

export type SupportingDocument = {
	uri: string;
	name: string;
	type: string; // actual MIME file type (pdf, txt, png etc.)
	document_type: SupportingDocumentType;
	signed_url?: string;
	is_new?: boolean;
};

export type SupportingDocumentToUpload = {
	name: string;
	blobBase64: string;
	type: string;
	// array_buffer: ArrayBuffer; // Supabase Storage needs array buffer
	document_type: SupportingDocumentType;
};

export const supportingDocumentTypes: SupportingDocumentType[] = [
	"insurance_claim",
	"company_letter",
	"referral_letter",
	"lab_result",
	"others",
];

export type SupportingDocumentType =
	| "insurance_claim"
	| "company_letter"
	| "referral_letter"
	| "lab_result"
	| "others";

export type RequestStatus = "pending" | "approved" | "rejected";

export type AppointmentRescheduleRequest = {
	id: string;
	appointment_id: string;
	requested_by: string; // patient.id
	new_starts_at: string; // timestamptz
	new_ends_at: string; // timestamptz
	status?: RequestStatus; // Make it optional since it is not needed when inserting
	type?: string;
	created_at?: string;
	updated_at?: string;
};

export type DoctorSchedule = {
  id: string;
  patient_id: string;
  patient: {
    full_name: string;
    email?: string;
    phone_number?: string;
  };
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  supporting_documents?: SupportingDocument[];
  reschedule_requests?: AppointmentRescheduleRequest[];
};

export type DoctorRescheduleRequest = {
  id: string; // reschedule request id
  appointment_id: string;
  requested_by_id: string; // patient id
  requested_by: {
    full_name: string;
    email?: string;
    phone_number?: string;
  };
  appointment: {
    starts_at: string;
    ends_at: string;
    patient_id: string;
    reason?: string;
    notes?: string;
  };
  new_starts_at: string;
  new_ends_at: string;
  status: RequestStatus; // "pending" | "approved" | "rejected"
  type?: string;
  created_at?: string;
  updated_at?: string;
  decision_by?: string;
  decided_at?: string;
};