// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		// record_date is destructured from ...ocrData on frontend, the rest of the fields will be stored under ocrData
		const { uid, avatar_file } = await req.json();
		console.log("Parsed request body:", { avatar_file });

		if (!uid || !avatar_file) {
			console.log("Missing UID in request");
			return new Response("Missing UID", { status: 400 });
		}

		const { name, blobBase64, type } = avatar_file;
		console.log("Processing file:", name);

		const filePath = `${uid}/${name}`;
		console.log("Processed file path:", filePath);

		// Convert base64 to Uint8Array (Supabase emphasises using Array buffer from Base64 file data)
		const fileBytes = Uint8Array.from(atob(blobBase64), (c) => c.charCodeAt(0));

		const { error: fileUploadError } = await supabase.storage
			.from("avatars")
			.upload(filePath, fileBytes, {
				contentType: avatar_file.type,
				upsert: true,
				metadata: { mime_type: avatar_file.type },
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

		// Get public URL of uploaded avatar
		const { data: urlData } = supabase.storage
			.from("avatars")
			.getPublicUrl(filePath);

		console.log("Avatar uploaded, public URL:", urlData.publicUrl);

		// Optionally update profile in database
		const { data: updatedData, error: updateError } =await supabase
			.from("profiles")
			.update({ avatar_url: urlData.publicUrl })
			.eq("id", uid)
			.select("avatar_url");

		if (updateError) {
			console.error("Error updating avatar_url in db:", updateError);
			return new Response("Failed to save avatar", { status: 500 });
		}
		const avatar_url = updatedData?.[0]?.avatar_url;

		console.log("Avatar file processed, returning URL");

		// Return signed URLs to client
		return new Response(JSON.stringify({ avatar_url }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in uploadAvatar Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
