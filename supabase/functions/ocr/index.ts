// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";
// eslint-disable-next-line import/no-unresolved
import { GoogleGenAI } from "npm:@google/genai";

const supabase = createClient(
	Deno.env.get("MY_SUPABASE_URL")!,
	Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY")!
);
// const supabase = createClient(Deno.env.get("MY_SUPABASE_URL")!, Deno.env.get("MY_SUPABASE_ANON_KEY")!);

Deno.serve({ port: 8000 }, async (req) => {
	try {
		const { path, title, date } = await req.json();
		console.log("Parsed request body:", { path, title, date });

		// Create signed URL for temporary access
		const { data: signed } = await supabase.storage
			.from("records")
			.createSignedUrl(path, 60); // valid for 1 minute

		if (!signed?.signedUrl) {
			console.error("Error creating signed URL");
			return new Response("Failed to get signed URL", { status: 400 });
		}
		console.log("Signed URL generated:", signed?.signedUrl);

		// Call Gemini OCR (API key lives safely here as it not in client code)
		const genAI = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY")! });
		const result = await genAI.models.generateContent({
			model: "gemini-2.5-flash",
			contents: "Extract all text from this medical record image.",
		});
		console.log("OCR result:", result.text);

		return new Response(JSON.stringify({ ocrText: result.text }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in OCR Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
