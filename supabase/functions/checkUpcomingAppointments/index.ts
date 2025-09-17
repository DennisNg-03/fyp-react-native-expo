// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
	try {
		const tz = "Asia/Kuala_Lumpur";

		const nowKL = new Date(
			new Date().toLocaleString("en-US", { timeZone: tz })
		);

		const todayStartUTC = new Date(
			Date.UTC(
				nowKL.getFullYear(),
				nowKL.getMonth(),
				nowKL.getDate(),
				0,
				0,
				0,
				0
			)
		);

		const twoDaysLaterUTC = new Date(
			Date.UTC(
				nowKL.getFullYear(),
				nowKL.getMonth(),
				nowKL.getDate() + 2,
				23,
				59,
				59,
				999
			)
		);

		const todayLocalString = nowKL.toLocaleDateString("en-MY", {
			timeZone: tz,
		}); // dd/mm/yyyy
		const twoDaysLocal = new Date(
			nowKL.getFullYear(),
			nowKL.getMonth(),
			nowKL.getDate() + 2
		);
		const twoDaysLocalString = twoDaysLocal.toLocaleDateString("en-MY", {
			timeZone: tz,
		});

		console.log("twoDaysLater dateString:", twoDaysLocalString);

		// Query appointments that are scheduled/rescheduled for today OR 2 days later
		const { data: appointments, error } = await supabase
			.from("appointments")
			.select("id, patient_id, starts_at")
			.in("status", ["scheduled", "rescheduled"])
			.gte("starts_at", todayStartUTC.toISOString())
			.lte("starts_at", twoDaysLaterUTC.toISOString());

		if (error) throw error;

		for (const appt of appointments || []) {
			const startsAt = new Date(appt.starts_at);

			const startsAtLocalString = startsAt.toLocaleDateString("en-MY", {
				timeZone: tz,
			}); // dd/mm/yyyy
			const formattedDate = startsAt.toLocaleString("en-MY", {
				timeZone: tz,
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

			console.log("Appt ID:", appt.id);
			console.log("Appt startsAt:", appt.starts_at);
			console.log("startsAtLocalString:", startsAtLocalString);
			console.log("todayLocalString:", todayLocalString);

			if (startsAtLocalString === todayLocalString) {
				// Send today's appointment reminder
				console.log("Matches today’s reminder criteria");
				title = "Today’s Appointment";
				body = `Your appointment is today at ${formattedDate}.`;
				type = "appointment_reminder_today";
			} else if (startsAtLocalString === twoDaysLocalString) {
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
