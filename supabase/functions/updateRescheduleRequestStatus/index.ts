// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

// This function will only be triggered by doctors or nurses
Deno.serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_ANON_KEY")!,
			{
				global: {
					headers: { Authorization: req.headers.get("Authorization")! },
				},
			}
		);

		const { id, appointment_id, status, new_starts_at, new_ends_at } =
			await req.json();
		console.log("Parsed request body:", {
			id,
			appointment_id,
			status,
			new_starts_at,
			new_ends_at,
		});

		if (!id || !appointment_id || !status) {
			return new Response("Missing required fields", { status: 400 });
		}

		const { error: reqError } = await supabase
			.from("appointment_reschedule_requests")
			.update({ status })
			.eq("id", id)
			.select();

		if (reqError) {
			return new Response(JSON.stringify({ error: reqError.message }), {
				status: 500,
			});
		}

		// 2. Update appointment depending on status
		// deno-lint-ignore no-explicit-any
		let updateData: any = {};
		if (status === "accepted") {
			updateData = {
				status: "rescheduled",
				// starts_at: new_starts_at,
				// ends_at: new_ends_at,
			};
		} else if (status === "rejected") {
			updateData = { status: "cancelled" }; // if reject, change appointment.status to cancelled
		}

		const { data, error: apptError } = await supabase
			.from("appointments")
			.update(updateData)
			.eq("id", appointment_id)
			.select("starts_at, patient_id");

		if (apptError) {
			return new Response(JSON.stringify({ error: apptError.message }), {
				status: 500,
			});
		}

		// 3. Insert Notifications record
		const patientId = data && data[0]?.patient_id;
		let messageTitle = "";
		let messageBody = "";
		let messageType = "";

		if (status === "rejected") {
			messageTitle = "Appointment Rejected";
			messageBody = "Your appointment rescheduling request has been rejected.";
			messageType = "appointment_rejected";
		} else if (status === "accepted") {
			messageTitle = "Appointment Confirmed";
			const startsAt =
				data && data[0]?.starts_at ? new Date(data[0].starts_at) : null;
			const formattedDate = startsAt
				? startsAt.toLocaleString("en-MY", {
						timeZone: "Asia/Kuala_Lumpur",
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
						hour: "numeric",
						minute: "2-digit",
						hour12: true,
				  })
				: "";
			messageBody = `Your appointment has been successfully rescheduled for ${formattedDate}.`;
			messageType = "appointment_accepted";
		}
		const { error: notificationError } = await supabase
			.from("notifications")
			.insert({
				user_id: patientId,
				appointment_id: appointment_id,
				title: messageTitle,
				body: messageBody,
				type: messageType,
			});

		if (notificationError) {
			return new Response(
				JSON.stringify({ error: notificationError.message }),
				{
					status: 500,
				}
			);
		}

		return new Response(JSON.stringify({ data }), {
			headers: { "Content-Type": "application/json" },
		});

		// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("Error in Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
