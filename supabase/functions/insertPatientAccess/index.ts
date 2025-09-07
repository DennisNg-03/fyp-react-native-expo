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

		const { patient_id, doctor_id, grant, appointment_id } = await req.json();

		if (!patient_id || !doctor_id || grant === undefined) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{
					status: 400,
				}
			);
		}

		if (typeof grant !== "boolean") {
			return new Response(JSON.stringify({ error: "Invalid grant value" }), {
				status: 400,
			});
		}

		const { data, error } = await supabase
			.from("patient_access")
			.insert([
				{
					patient_id,
					doctor_id,
					grant_status: grant,
					appointment_id: appointment_id ?? null,
					created_at: new Date().toISOString(),
				},
			])
			.select();

		if (error) {
			console.error("Error inserting patient access:", error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
			});
		}

		return new Response(JSON.stringify({ data }), {
			headers: { "Content-Type": "application/json" },
		});

		// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("Error in insertPatientAccess:", err);
		return new Response(
			JSON.stringify({ error: err.message ?? "Unknown error" }),
			{ status: 500 }
		);
	}
});
