export type UserRole = "doctor" | "nurse" | "patient" | null;

export type Provider = {
	id: string;
	name: string;
	provider_type: string;
	address?: string;
	phone?: string;
	timezone?: string;
};

export type Doctor = {
	id: string;
	profiles?: { full_name?: string | null } | null;
	speciality?: string | null;
	slot_minutes: number;
	timezone: string;
	provider_id?: string | null;
};

export type Slot = {
	slot_start: string;
	slot_end: string;
	is_blocked: boolean;
};
