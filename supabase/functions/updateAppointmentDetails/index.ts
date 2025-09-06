// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";
import {
	Appointment,
	IncomingFile,
	SupportingDocument,
	SupportingDocumentType,
} from "../../../types/appointment.ts";

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

		const {
			id,
			patient_id,
			reason,
			notes,
			supporting_documents,
			new_documents,
			removed_documents,
		} = (await req.json()) as Appointment;

		console.log("Parsed request body:", {
			id,
			patient_id,
			reason,
			notes,
			supporting_documents,
			new_documents,
			removed_documents,
		});

		// Validation
		if (!id || !reason) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400 }
			);
		}

		// Create an array of objects representing files to remove from Supabase storage
		const removedFilePaths = (removed_documents ?? []).map(
			(file) => `appointments/${file.uri}`
		);

		console.log("Paths to remove:", removedFilePaths);

		// Delete file from Supabase storage
		if (removedFilePaths.length > 0) {
			console.log("removedFilePaths:", removedFilePaths);
			const { error: removeError } = await supabase.storage
				.from("appointments")
				.remove(removedFilePaths);

			if (removeError) {
				console.error("Error removing files:", removeError);
			} else {
				console.log("Removed files successfully!");
			}
		}
		const finalSupportingDocuments: SupportingDocument[] = (
			supporting_documents ?? []
		)
			.filter((doc): doc is SupportingDocument => "uri" in doc) // type guard
			.filter((doc) => !doc.is_new) // Exclude new documents from the final array first
			.map((doc) => {
				const { signed_url: _signed_url, ...rest } = doc;
				return {
					...rest,
					document_type: doc.document_type as SupportingDocumentType,
				};
			});

		if (new_documents) {
			for (const file of new_documents) {
				const { name, blobBase64, type, document_type } = file as IncomingFile;
				console.log("Processing file:", name);

				const filePath = `${
					file.document_type
				}/${patient_id}/${Date.now()}-${name}`;
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

				finalSupportingDocuments.push({
					uri: filePath,
					name: name,
					type: type,
					document_type: document_type as SupportingDocumentType,
				});
			}
		}

		const updates: Partial<Appointment> = {};
		if (reason) updates.reason = reason;
		if (notes) updates.notes = notes;
		updates.supporting_documents =
			finalSupportingDocuments as SupportingDocument[];
		updates.updated_at = new Date().toISOString();

		// Insert into appointments
		const { data, error: updateError } = await supabase
			.from("appointments")
			.update(updates)
			.eq("id", id)
			.select();

		if (updateError) {
			console.error("Error inserting medical record:", updateError);
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
