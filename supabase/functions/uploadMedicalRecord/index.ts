// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
		// {
		// 	global: {
		// 		headers: { Authorization: req.headers.get("Authorization")! },
		// 	},
		// }
	);

	// const authHeader = req.headers.get("Authorization");
	// if (!authHeader) return new Response("Missing token", { status: 401 });

	// const token = authHeader.split(" ")[1]; // remove "Bearer "
	// const { data: user, error } = await supabase.auth.getUser(token);
	// if (error) return new Response("Invalid token", { status: 401 });

	try {
		const { files, title, date, uid } = await req.json();
		console.log("Parsed request body:", { files, title, date, uid });

		if (!uid) {
			console.log("Missing UID in request");
			return new Response("Missing UID", { status: 400 });
		}

		const uploadedUrls: string[] = []; // For passing to client to call OCR function
		const uploadedFileNames: string[] = []; // For storing in database for future retrieval

		for (const file of files) {
			const { name, blobBase64 } = file; // receive base64 string from client
			console.log("Processing file:", name);

			const buffer = Uint8Array.from(atob(blobBase64), (c) => c.charCodeAt(0));

			const fileName = `${uid}/${Date.now()}-${name}`;
			uploadedFileNames.push(fileName);

			const { data, error } = await supabase.storage
				.from("medical-records")
				.upload(fileName, buffer, { contentType: "image/jpeg" });

			if (error) {
				console.error("Upload error:", error);
				return new Response(
					JSON.stringify({
						message: "Upload failed",
						error,
						fileName,
					}),
					{ status: 500, headers: { "Content-Type": "application/json" } }
				);
			}

			const { error: insertError } = await supabase
				.from("medical_records")
				.insert([
					{
						user_id: uid,
						title,
						date,
						file_paths: uploadedFileNames,
						ocr_text: null,
					},
				]);

			if (insertError) {
				console.error("Error inserting medical record:", insertError);
				return new Response("Failed to save record", { status: 500 });
			}

			// Create Signed URL for the  Supabase Storage
			const { data: signedData } = await supabase.storage
				.from("medical-records")
				.createSignedUrl(fileName, 60 * 60);

			if (!signedData?.signedUrl) {
				console.error("Upload error:", error);
				return new Response(
					JSON.stringify({
						message: "Failed to get signed URL",
						error,
						fileName,
					}),
					{ status: 500, headers: { "Content-Type": "application/json" } }
				);
			}

			console.log("Uploaded and signed URL generated:");
			// console.log("Uploaded and signed URL generated:", signedData.signedUrl);
			uploadedUrls.push(signedData.signedUrl);
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
