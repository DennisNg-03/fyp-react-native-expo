export type Slot = {
	slot_start: string;
	slot_end: string;
	is_blocked: boolean;
};

// SupportingDocument[]  is only used on frontend display and must be generated on backend, so it will not be in the payload sent to backend

export type SupportingDocument = {
  uri: string;
  name: string;
  // type: string; // actual MIME file type (pdf, txt, png etc.)
  type: SupportingDocumentType;
};

export type SupportingDocumentToUpload = {
	name: string;
	blobBase64: string;
	type: string;
	// array_buffer: ArrayBuffer; // Supabase Storage needs array buffer
	document_type: SupportingDocumentType;
}
 
export type SupportingDocumentType =
  | "insurance_claim"
  | "company_letter"
  | "referral_letter"
  | "lab_result"
  | "others";