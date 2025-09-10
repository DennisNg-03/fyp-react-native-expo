// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
	try {
		const now = new Date();

		// Use plain Date objects and set hours/dates directly, relying on .toISOString() for UTC conversion
		const todayStart = new Date(now);
		todayStart.setUTCHours(0, 0, 0, 0);
		const todayEnd = new Date(now);
		todayEnd.setUTCHours(23, 59, 59, 999);
		const twoDaysLater = new Date(todayStart);
		twoDaysLater.setUTCDate(todayStart.getUTCDate() + 2);

		console.log("todayStart (UTC, ISO):", todayStart.toISOString());
		console.log("todayEnd (UTC, ISO):", todayEnd.toISOString());
		console.log("twoDaysLater (UTC, ISO):", twoDaysLater.toISOString());

		const tz = "Asia/Kuala_Lumpur";

		// Query appointments that are scheduled/rescheduled for today OR 2 days later
		const { data: appointments, error } = await supabase
			.from("appointments")
			.select("id, patient_id, starts_at")
			.in("status", ["scheduled", "rescheduled"])
			.gte("starts_at", todayStart.toISOString())
			.lte("starts_at", twoDaysLater.toISOString());

		if (error) throw error;

		for (const appt of appointments || []) {
			const startsAt = new Date(appt.starts_at);
			const formattedDate = startsAt.toLocaleString("en-MY", {
				timeZone: "Asia/Kuala_Lumpur",
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			});

			let title = "";
			let body = "";
			let type = "";

			if (startsAt >= todayStart && startsAt <= todayEnd) {
				// Send today's appointment reminder
				// console.log("Matches today’s reminder criteria");
				title = "Today’s Appointment";
				body = `Your appointment is today at ${formattedDate}.`;
				type = "appointment_reminder_today";
			} else if (startsAt.toDateString() === twoDaysLater.toDateString()) {
				// Send appointment reminder two days before the scheduled date
				console.log("Matches two days before reminder criteria");
				title = "Upcoming Appointment";
				body = `Your appointment is in 2 days at ${formattedDate}. If you need to reschedule, please submit your request no later than 24 hours before the appointment.`;
				type = "appointment_reminder_2days";
			} else {
				console.log("No reminder criteria matched for this appointment");
			}

			if (title) {
				// console.log("Preparing to insert notification");
				const { data: insertedData, error: insertError } = await supabase
					.from("notifications")
					.insert({
						user_id: appt.patient_id,
						appointment_id: appt.id,
						title,
						body,
						type,
					});

				if (insertError) {
					console.error("Insert notification failed:", insertError);
				} else {
					console.log("Insert notification succeeded:", insertedData);
				}
			}
		}

		return new Response("Reminders processed", { status: 200 });
		// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("checkUpcomingAppointments error:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
