// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";
// eslint-disable-next-line import/no-unresolved
import { GoogleGenAI } from "npm:@google/genai";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_ANON_KEY")!,
		{
			global: {
				headers: { Authorization: req.headers.get("Authorization")! },
			},
		}
	);

	try {
		const { signedUrl, title, date } = await req.json();
		console.log("Parsed request body:", { signedUrl, title, date });

		if (!signedUrl) {
			return new Response("Missing signedUrl", { status: 400 });
		}

		// Call Gemini OCR directly using the signed URL
		const genAI = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY")! });
		const result = await genAI.models.generateContent({
			model: "gemini-2.5-flash",
			contents: `Extract all text from this medical record image using OCR: ${signedUrl}`,
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
