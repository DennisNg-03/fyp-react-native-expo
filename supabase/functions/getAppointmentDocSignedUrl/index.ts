// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		// Parse request body
		const { supporting_documents } = await req.json();

		if (!supporting_documents || !Array.isArray(supporting_documents)) {
			return new Response("Missing or invalid supporting_documents", { status: 400 });
		}

		// Generate signed URLs for each doc
		const docsWithUrls = await Promise.all(
			// deno-lint-ignore no-explicit-any
			supporting_documents.map(async (doc: any) => {
				try {
					console.log("doc.uri:", doc.uri);
					const { data: signed, error: signedErr } = await supabase.storage
						.from("appointments")
						.createSignedUrl(doc.uri, 60 * 60); // 1h expiry

					if (signedErr || !signed) {
						console.warn("Error creating signed URL:", signedErr);
						return { ...doc, signed_url: null };
					}

					return { ...doc, signed_url: signed.signedUrl };
				} catch (e) {
					console.warn("Unexpected signed URL error:", e);
					return { ...doc, signed_url: null };
				}
			})
		);

		return new Response(JSON.stringify({ supporting_documents: docsWithUrls }), {
			headers: { "Content-Type": "application/json" },
		});
		// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("Error in getAppointmentDocSignedUrl Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});