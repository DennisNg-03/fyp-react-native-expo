// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

type IncomingFile = {
	name: string;
	blobBase64: string;
	type: "image" | "document";
};

type RequestBody = {
	files: IncomingFile[];
	title: string;
	date: string;
	uid: string;
	record_type: string;
};

function getMimeType(
	fileName: string,
	fallback: string = "application/octet-stream"
): string {
	const extension = fileName.split(".").pop()?.toLowerCase();

	switch (extension) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		case "pdf":
			return "application/pdf";
		case "doc":
			return "application/msword";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "txt":
			return "text/plain";
		default:
			return fallback;
	}
}

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		const { files, title, date, uid, record_type } =
			(await req.json()) as RequestBody;
		console.log("Parsed request body:", { files, title, date, uid });

		if (!uid) {
			console.log("Missing UID in request");
			return new Response("Missing UID", { status: 400 });
		}

		const filePaths: { uri: string; name: string; type: string }[] = [];
		const uploadedUrls: string[] = []; // For passing to client to call OCR function
		// const uploadedFileNames: string[] = []; // For storing in database for future retrieval

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
			const mimeType = getMimeType(name);
			console.log("MIME type:", mimeType);

			const { error: fileUploadError } = await supabase.storage
				.from("medical-records")
				.upload(filePath, fileBytes, {
					contentType: mimeType,
					metadata: { mime_type: mimeType },
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

		const { error: insertError } = await supabase
			.from("medical_records")
			.insert([
				{
					title,
					date,
					record_type,
					patient_id: uid,
					file_paths: filePaths,
					ocr_text: null,
				},
			]);

		if (insertError) {
			console.error("Error inserting medical record:", insertError);
			return new Response("Failed to save record", { status: 500 });
		}

		console.log("All files processed, returning URLs");

		// Return signed URLs to client
		return new Response(JSON.stringify({ uploadedUrls }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
