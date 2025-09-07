// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";
import { Appointment, IncomingFile } from "../../../types/appointment.ts";

// type IncomingFile = {
// 	name: string;
// 	blobBase64: string;
// 	type: string;
// 	document_type: string;
// };

// type RequestBody = {
// 	doctor_id: string;
// 	patient_id: string;
// 	starts_at: string;
// 	ends_at: string;
// 	reason: string;
// 	for_whom: "me" | "someone_else";
// 	other_person: OtherPerson;
// 	supporting_documents: IncomingFile[];
// };

Deno.serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
		);

		const {
			doctor_id,
			patient_id,
			starts_at,
			ends_at,
			reason,
			notes,
			for_whom,
			other_person,
			grant_doctor_access,
			supporting_documents,
		} = (await req.json()) as Appointment;

		console.log("Parsed request body:", {
			doctor_id,
			patient_id,
			starts_at,
			ends_at,
			reason,
			notes,
			for_whom,
			other_person,
			grant_doctor_access,
			supporting_documents,
		});

		// Validation
		if (!doctor_id || !patient_id || !starts_at || !ends_at || !reason || !for_whom) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400 }
			);
		}

		const supportingDocuments: { uri: string; name: string; type: string; document_type: string }[] = [];

		if (supporting_documents) {
			for (const file of supporting_documents) {
			const { name, blobBase64, type, document_type } = file as IncomingFile;
			console.log("Processing file:", name);

			const filePath = `${file.document_type}/${patient_id}/${Date.now()}-${name}`;
			console.log("Processed file path:", filePath);

			// Convert base64 to Uint8Array (Supabase emphasises using Array buffer from Base64 file data)
			const fileBytes = Uint8Array.from(atob(blobBase64), (c) =>
				c.charCodeAt(0)
			);

			const { error: fileUploadError } = await supabase.storage
				.from("appointments")
				.upload(filePath, fileBytes, {
					contentType: file.type,
					metadata: { mime_type: file.type },
				});

			if (fileUploadError) {
				console.error("File Upload error:", fileUploadError);
				return new Response(
					JSON.stringify({
						message: "Upload failed",
						fileUploadError,
						filePath,
					}),
					{ status: 500, headers: { "Content-Type": "application/json" } }
				);
			}

			supportingDocuments.push({
				uri: filePath,
				name: name,
				type: type,
				document_type: document_type,
			});
		}
		}

		// Insert into appointments
		const { data, error: insertError } = await supabase
			.from("appointments")
			.insert([
				{
					doctor_id,
					patient_id,
					starts_at,
					ends_at,
					reason,
					notes: notes ?? null,
					for_whom,
					other_person: other_person ?? null,
					grant_doctor_access,
					supporting_documents: supportingDocuments ?? null,
				},
			])
			.select("id")
			.single();

		if (insertError) {
			console.error("Error inserting medical record:", insertError);
			return new Response("Failed to save record", { status: 500 });
		}

		console.log("All files processed, returning URLs & new record ID");

		return new Response(JSON.stringify({ appointment_id: data?.id }), {
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
