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

		// Check if a patient_access row already exists
		const { data: existing, error: fetchError } = await supabase
			.from("patient_access")
			.select("*")
			.eq("patient_id", patient_id)
			.eq("doctor_id", doctor_id)
			.single();

		if (fetchError && fetchError.code !== "PGRST116") {
			// PGRST116 = no rows found
			console.error("Error checking existing access:", fetchError);
			return new Response(JSON.stringify({ error: fetchError.message }), {
				status: 500,
			});
		}

		if (existing) {
			console.log("There is an existing patient access record:", existing);
			// Update revoked_at depending on grant
			const { data, error } = await supabase
				.from("patient_access")
				.update({
					granted_at: grant ? new Date().toISOString() : existing.granted_at,
					revoked_at: grant ? null : new Date().toISOString(),
					appointment_id: appointment_id ?? existing.appointment_id,
				})
				.eq("id", existing.id)
				.select();

			if (error) {
				console.error("Error updating patient access:", error);
				return new Response(JSON.stringify({ error: error.message }), {
					status: 500,
				});
			}

			return new Response(JSON.stringify({ data }), {
				headers: { "Content-Type": "application/json" },
			});
		} else if (grant) {
			console.log("No existing patient access record");
			// Insert a new row only if granting access
			const { data, error } = await supabase
				.from("patient_access")
				.insert([
					{
						patient_id,
						doctor_id,
						granted_at: new Date().toISOString(),
						revoked_at: null,
						appointment_id: appointment_id ?? null,
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
		}

		// If user tries to revoke a non-existing record
		return new Response(
			JSON.stringify({ message: "No existing access to revoke" }),
			{ status: 200 }
		);

		// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("Error in upsertPatientAccess:", err);
		return new Response(
			JSON.stringify({ error: err.message ?? "Unknown error" }),
			{ status: 500 }
		);
	}
});
