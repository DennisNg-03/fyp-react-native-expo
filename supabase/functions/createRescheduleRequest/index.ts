// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";
import { AppointmentRescheduleRequest } from "../../../types/appointment.ts";

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

		const { appointment_id, requested_by, new_starts_at, new_ends_at } =
			(await req.json()) as AppointmentRescheduleRequest;

		console.log("Parsed request body:", {
			appointment_id,
			requested_by,
			new_starts_at,
			new_ends_at,
		});

		// Validation
		if (!appointment_id || !new_starts_at || !new_ends_at) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400 }
			);
		}

		// Insert a new reschedule request record
		const { data, error: insertError } = await supabase
			.from("appointment_reschedule_requests")
			.insert([
				{
					appointment_id,
					requested_by,
					new_starts_at,
					new_ends_at,
				},
			])
			.select();

		if (insertError) {
			console.error("Error inserting reschedule request:", insertError);
			return new Response("Failed to save record", { status: 500 });
		}

		console.log("All files processed, returning URLs & new record ID");

		return new Response(JSON.stringify({ data }), {
			headers: { "Content-Type": "application/json" },
		});
	// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("Error booking appointment:", err);
		return new Response(
			JSON.stringify({ error: err.message ?? "Unknown error" }),
			{ status: 500 }
		);
	}
});
