// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

import { AdditionalMedicalRecordField } from "../../../types/medicalRecord.ts";

type IncomingFile = {
	name: string;
	blobBase64: string;
	type: string;
};

type RequestBody = {
	files: IncomingFile[];
	title: string;
	uid: string;
	record_type: string;
	record_date: string; // Will be destructured from ocrData
} & Partial<Record<AdditionalMedicalRecordField, string>>;

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		// record_date is destructured from ...ocrData on frontend, the rest of the fields will be stored under ocrData
		const { files, title, uid, record_type, record_date, ...ocrData } = (await req.json()) as RequestBody;
		console.log("Parsed request body:", { files, title, record_date, uid });
		console.log("OCR Data:", ocrData);

		if (!uid) {
			console.log("Missing UID in request");
			return new Response("Missing UID", { status: 400 });
		}

		const filePaths: { uri: string; name: string; type: string }[] = [];
		const uploadedUrls: string[] = []; // For passing to client to call OCR function

		// const safeOcrData = Object.fromEntries(
		// 	Object.entries(ocrData).filter(([_, v]) => v !== null && v !== undefined && v !== "")
		// );

		for (const file of files) {
			const { name, blobBase64, type } = file;
			console.log("Processing file:", name);

			const filePath = `${uid}/${Date.now()}-${name}`;
			console.log("Processed file path:", filePath);

			// Convert base64 to Uint8Array (Supabase emphasises using Array buffer from Base64 file data)
			const fileBytes = Uint8Array.from(atob(blobBase64), (c) =>
				c.charCodeAt(0)
			);

			// Upload files to Supabase storage
			// const mimeType = getMimeType(name);
			// console.log("MIME type:", mimeType);

			const { error: fileUploadError } = await supabase.storage
				.from("medical-records")
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

			filePaths.push({
				uri: filePath,
				name: name,
				type: type,
			});

			// Create Signed URL for the Supabase Storage
			const { data: signedData, error: signedUrlError } = await supabase.storage
				.from("medical-records")
				.createSignedUrl(filePath, 60 * 60);

			if (!signedData?.signedUrl) {
				console.error("Signed URL error:", signedUrlError);
				return new Response(
					JSON.stringify({
						message: "Failed to get signed URL",
						signedUrlError,
						filePath,
					}),
					{ status: 500, headers: { "Content-Type": "application/json" } }
				);
			}

			console.log("Uploaded and signed URL generated:");
			// console.log("Uploaded and signed URL generated:", signedData.signedUrl);
			uploadedUrls.push(signedData.signedUrl);
		}

		const { data: insertedRecords, error: insertError } = await supabase
			.from("medical_records")
			.insert([
				{
					title,
					record_date,
					record_type,
					patient_id: uid,
					file_paths: filePaths,
					...ocrData,
				},
			])
			.select("id, patient_id, updated_at");

		if (insertError) {
			console.error("Error inserting medical record:", insertError);
			return new Response("Failed to save record", { status: 500 });
		}
		const newRecordId = insertedRecords?.[0]?.id; // the first inserted row's id
		const newRecordPatientId = insertedRecords?.[0]?.patient_id; // the first inserted row's patient_id
		const updated_at = insertedRecords?.[0]?.updated_at; // the first inserted row's patient_id

		console.log("All files processed, returning URLs & new record ID");

		// Return signed URLs to client
		return new Response(JSON.stringify({ recordId: newRecordId, patientId: newRecordPatientId, updatedAt: updated_at, uploadedUrls }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
