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
		const body = await req.json();
		const {
			user_id,
			full_name,
			phone_number,
			gender,
			role,
			// patient fields
			date_of_birth,
			blood_type,
			allergies,
			current_medications,
			chronic_conditions,
			past_surgeries,
			insurance_info,
			medical_history,
			emergency_contact,
			// doctor/nurse fields
			speciality,
			availability,
			bio,
			provider_id,
			assigned_doctor_id,
		} = body;

		// Update base profile
		const { error: profileError } = await supabase
			.from("profiles")
			.update({ full_name, phone_number, gender })
			.eq("id", user_id);

		if (profileError) return new Response(profileError.message, { status: 400 });

		// Update role-specific table
		if (role === "patient") {
			const { error: patientError } = await supabase
				.from("patients")
				.update({
					date_of_birth,
					blood_type,
					allergies,
					current_medications,
					chronic_conditions,
					past_surgeries,
					insurance_info,
					medical_history,
					emergency_contact,
				})
				.eq("id", user_id);

			if (patientError)
				return new Response(patientError.message, { status: 400 });
		} else if (role === "doctor") {
			const { error: doctorError } = await supabase
				.from("doctors")
				.update({ speciality, availability, bio, provider_id })
				.eq("id", user_id);

			if (doctorError) return new Response(doctorError.message, { status: 400 });
		} else if (role === "nurse") {
			const { error: nurseError } = await supabase
				.from("nurses")
				.update({ assigned_doctor_id, provider_id })
				.eq("id", user_id);

			if (nurseError) return new Response(nurseError.message, { status: 400 });
		}

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (err: any) {
		return new Response(`Server error: ${err.message}`, { status: 500 });
	}
});