// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_ANON_KEY")!,
		{
			global: {
				headers: { Authorization: req.headers.get("Authorization")! },
			},
		}
	);

	try {
		const { user_id, email, role, provider_id } = await req.json();

		// Update base profile
		const { error: userError } = await supabase
			.from("profiles")
			.update({ email, role })
			.eq("id", user_id);

		if (userError) {
			return new Response(userError.message, { status: 400 });
		}

		// Insert into role-specific table
		if (role === "patient") {
			const { error: patientError } = await supabase
				.from("patients")
				.insert([{ id: user_id }]);

			if (patientError) {
				return new Response(patientError.message, { status: 400 });
			}
		}

		if (role === "doctor") {
			const { error: doctorError } = await supabase
				.from("doctors")
				.insert([{ id: user_id, provider_id }]);

			if (doctorError) {
				return new Response(doctorError.message, { status: 400 });
			}
		}

		if (role === "nurse") {
			const { error: nurseError } = await supabase
				.from("nurses")
				.insert([{ id: user_id, provider_id }]);

			if (nurseError) {
				return new Response(nurseError.message, { status: 400 });
			}
		}

		return new Response(JSON.stringify({ success: true }), { status: 200 });

	} catch (err: any) {
		return new Response(`Server error: ${err.message}`, { status: 500 });
	}
});