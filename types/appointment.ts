export type Appointment = {
	id: string;
	doctor_id: string;
	patient_id: string;
	// patient_name: string;
	// patient_identification_number: string;
	starts_at: string; // timestamptz
	ends_at: string; // timestamptz
	status?: "pending" | "confirmed" | "cancelled" | "completed"; // Make it optional since it is not need when inserting
	reason: string;
	notes?: string;
	for_whom: "me" | "someone_else";
	other_person?: OtherPerson;
	supporting_documents?: SupportingDocument[] | IncomingFile[];
	// doctor?: {
	// 	speciality: string;
	// 	profiles: {
	// 		full_name: string;
	// 	};
	// 	provider: {
	// 		name: string;
	// 		provider_type: string;
	// 		address: string;
	// 	};
	// }[];
	// Flattened doctor and provider
	doctor?: { // doctor is an alias given to the join result
		full_name: string;
		email?: string;
		phone_number?: string;
		speciality: string;
		slot_minutes?: string;
	};
	provider?: { // provider is an alias given to the join result
		name: string;
		provider_type: string;
		address?: string;
		phone_number?: string;
	};
};

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
