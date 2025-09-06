export type FlattenedUser =
	| (PatientProfile & { role: "patient" })
	| (DoctorProfile & { role: "doctor" })
	| (NurseProfile & { role: "nurse" });

export type UserRole = "doctor" | "nurse" | "patient" | null;

export type PatientProfile = {
	id: string;
	full_name: string;
	email: string;
	phone_number: string;
	gender: string;
	avatar_url?: string;
	date_of_birth?: string;
	insurance_info?: string;
	medical_history?: string;
	blood_type?: string;
	allergies?: string;
	current_medications?: string;
	chronic_conditions?: string;
	past_surgeries?: string;
	emergency_contact?: string;
};

export type DoctorProfile = {
	id: string;
	full_name: string;
	email: string;
	phone_number: string;
	gender: string;
	avatar_url?: string;
	speciality: string;
	slot_minutes: number;
	timezone?: string;
	provider_id: string;
	availability?: string;
	bio?: string;
};

export type NurseProfile = {
	id: string;
	full_name: string;
	email: string;
	phone_number: string;
	gender: string;
	avatar_url?: string;
	provider_id: string;
	assigned_doctor_id?: string;
};

// Use when handling appointments
export type Doctor = {
	id: string;
	profiles?: { full_name?: string | null } | null;
	speciality: string;
	slot_minutes: number;
	timezone?: string;
	provider_id: string;
};

export type Provider = {
	id: string;
	name: string;
	provider_type: string;
	address?: string;
	phone?: string;
	timezone?: string;
};
