// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_ANON_KEY")!,
	);

	const { userId, email, role, date_of_birth, insurance_info } = await req.json();

	const updated_at = new Date().toISOString();

	const { error: userError } = await supabase
		.from("profiles")
		.update({ email, role, updated_at })
		.eq("id", userId);

	if (userError) return new Response(userError.message, { status: 400 });

	const { error: patientError } = await supabase
		.from("patients")
		.insert([
			{ id: userId, date_of_birth, insurance_info, medical_history: {} },
		]);
	if (patientError) return new Response(patientError.message, { status: 400 });

	return new Response(JSON.stringify({ success: true }), { status: 200 });
});
