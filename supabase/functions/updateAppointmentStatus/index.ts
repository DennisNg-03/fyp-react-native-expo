// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

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

		const { id, status } = await req.json();
		console.log("Parsed request body:", { id, status });

		if (!id || !status) {
			return new Response("Missing required fields!", { status: 400 });
		}

		const { data, error } = await supabase
			.from("appointments")
			.update({ status })
			.eq("id", id)
			.select("starts_at, patient_id");

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
			});
		}

		const patientId = data && data[0]?.patient_id;
		let messageTitle = "";
		let messageBody = "";
		let messageType = "";

		if (status === "cancelled") {
			messageTitle = "Appointment Rejected";
			messageBody = "Your appointment has been rejected.";
			messageType = "appointment_rejected";

		} else if (status === "scheduled") {
			messageTitle = "Appointment Confirmed";
			const startsAt = data && data[0]?.starts_at ? new Date(data[0].starts_at) : null;
			const formattedDate = startsAt
				? startsAt.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
				: "";
			messageBody = `Your appointment has been successfully scheduled for ${formattedDate}.`;
			messageType = "appointment_accepted";
		}
		const { error: notificationError } = await supabase.from("notifications").insert({
			user_id: patientId,
			appointment_id: id,
			title: messageTitle,
			body: messageBody,
			type: messageType,
		});

		if (notificationError) {
			return new Response(JSON.stringify({ error: notificationError.message }), {
				status: 500,
			});
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
