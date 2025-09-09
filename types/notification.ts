export type Notification = {
	id: string;
	title: string;
	body: string;
	type: "appointment_accepted" | "appointment_rejected" | "appointment_reminder_today" | "appointment_reminder_2days";
	created_at: string;
	read_at: string;
};
