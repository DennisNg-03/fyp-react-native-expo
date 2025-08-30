// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

import { SelectedFile } from "../../../types/medicalRecord.ts";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		const url = new URL(req.url);
		const uid = url.searchParams.get("uid");
		const role = url.searchParams.get("role");
		if (!uid) return new Response("Missing uid", { status: 400 });
		if (!role) return new Response("Missing role", { status: 400 });

		// Get data from medical_records table in db
		if (role === "patient") {
			const { data: records, error } = await supabase
				.from("medical_records")
				.select("*")
				.eq("patient_id", uid)
				.order("record_date", { ascending: false })
				.order("updated_at", { ascending: false });

			if (error)
				return new Response("DB error: " + error.message, { status: 500 });
			if (!records || records.length === 0)
				return new Response(JSON.stringify({ signedUrls: [] }), {
					status: 200,
				});

			const recordsWithUrls = await Promise.all(
				records.map(async (record) => {
					const files: SelectedFile[] = record.file_paths ?? [];
					console.log("Record.file_paths:", files);

					// Get signed URLs for all the files
					const signedUrls = await Promise.all(
						files.map(async (file) => {
							const { data, error } = await supabase.storage
								.from("medical-records")
								.createSignedUrl(file.uri, 60 * 60);
							if (error || !data) {
								console.error("Error creating signed URL:", error);
								return new Response(
									`Failed to create signed URL for ${file}.` + error.message,
									{ status: 500 }
								);
							}

							return data.signedUrl;
						})
					);

					const { id, title, record_type, patient_id, file_paths, ...ocrData } = record;

					return {
						id,
						title,
						record_type,
						patient_id,
						file_paths: file_paths as SelectedFile[],
						signed_urls: signedUrls,
						...ocrData,
					};
				})
			);

			return new Response(JSON.stringify({ recordsWithUrls }), {
				headers: { "Content-Type": "application/json" },
			});
		} else {
			return new Response("Doctor logic to be handled", { status: 250 });
		}
	} catch (err: any) {
		console.error("Error in getMedicalRecordUrlPatient Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
