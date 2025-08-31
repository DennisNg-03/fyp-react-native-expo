// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

type FilePath = {
	uri: string;
	name: string;
	type: string;
};

Deno.serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
		);

		const { record_id } = await req.json();
		console.log("Delete request for record_id:", record_id);

		if (!record_id) {
			return new Response(
				JSON.stringify({ success: false, message: "Missing record_id" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// Fetch the record to get file_paths for images/documents
		const { data: record, error: fetchError } = await supabase
			.from("medical_records")
			.select("file_paths")
			.eq("id", record_id)
			.single();

		if (fetchError) {
			return new Response(
				JSON.stringify({ success: false, message: fetchError.message }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		// Get the uri of all the objects inside file_paths to create an array formed by the uris
		if (record?.file_paths && Array.isArray(record.file_paths)) {
			const fileUris = (record.file_paths as FilePath[]).map((f) => f.uri);
			if (fileUris.length > 0) {
				const { error: storageError } = await supabase.storage
					.from("medical-records")
					.remove(fileUris);

				if (storageError) {
					console.error(
						"Error deleting files from storage:",
						storageError.message
					);
					return new Response(
						JSON.stringify({ success: false, message: storageError.message }),
						{ status: 500, headers: { "Content-Type": "application/json" } }
					);
				}
			}
		}

		// Delete the record from DB
		const { error } = await supabase
			.from("medical_records")
			.delete()
			.eq("id", record_id);

		if (error) {
			return new Response(
				JSON.stringify({ success: false, message: error.message }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Record deleted successfully!",
				record_id,
			}),
			{ headers: { "Content-Type": "application/json" } }
		);
	} catch (err: any) {
		console.error("Error in Edge Function (delete):", err);
		return new Response(
			JSON.stringify({ success: false, message: err.message }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
});
