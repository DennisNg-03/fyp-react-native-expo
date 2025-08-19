// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		const url = new URL(req.url);
		const uid = url.searchParams.get("uid");
		if (!uid) return new Response("Missing uid", { status: 400 });

		// Get data from medical_records table in db
		const { data: records, error } = await supabase
			.from("medical_records")
			.select("*")
			.eq("user_id", uid)
			.order("date", { ascending: false }) // sort in descending order
			.order("updated_at", { ascending: false });

		if (error)
			return new Response("DB error: " + error.message, { status: 500 });
		if (!records || records.length === 0)
			return new Response(JSON.stringify({ signedUrls: [] }), { status: 200 });

		const recordsWithUrls = await Promise.all(
			records.map(async (record) => {
				const signedUrls: string[] = await Promise.all(
					record.file_paths.map(async (path: string) => {
						const { data, error } = await supabase.storage
							.from("medical-records")
							.createSignedUrl(path, 60 * 60);
						if (error || !data)
							throw new Error(`Failed to create signed URL for ${path}`);
						return data.signedUrl;
					})
				);
				return {
					id: record.id,
					title: record.title,
					date: record.date,
					user_id: record.user_id,
					file_paths: record.file_paths,
					signed_urls: signedUrls,
				};
			})
		);

		return new Response(JSON.stringify({ recordsWithUrls }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in getMedicalRecordUrlPatient Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
