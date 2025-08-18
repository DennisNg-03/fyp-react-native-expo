// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
	Deno.env.get("MY_SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
	try {
		const { files, title, date, uid } = await req.json();
		console.log("Parsed request body:", { files, title, date, uid });

		if (!uid) {
			console.log("Missing UID in request");
			return new Response("Missing UID", { status: 400 });
		}

		const uploadedUrls: string[] = [];

		for (const file of files) {
			const { name, blobBase64 } = file; // receive base64 string from client
			console.log("Processing file:", name);

			const buffer = Uint8Array.from(atob(blobBase64), (c) => c.charCodeAt(0));

			const fileName = `medical-records/${Date.now()}-${name}`;

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

			console.log("Uploaded and signed URL generated:", signedData.signedUrl);
			uploadedUrls.push(signedData.signedUrl);
		}

		console.log("All files processed, returning URLs");
		return new Response(JSON.stringify({ uploadedUrls }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
