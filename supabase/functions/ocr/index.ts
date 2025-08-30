// eslint-disable-next-line import/no-unresolved
import { GoogleGenAI } from "npm:@google/genai";

import { AdditionalMedicalRecordFields } from "../../../types/medicalRecord.ts";

type IncomingFile = {
	name: string;
	blobBase64: string;
	type: string; // Expect to be blob.type (MIME format)
};

Deno.serve(async (req) => {
	try {
		const { files, title, record_type } = (await req.json()) as {
			files: IncomingFile[];
			title: string;
			record_date: string;
			record_type: string;
		};
		console.log("Parsed request body:", {
			files,
			title,
			record_type,
		});

		const prompt = `
Extract the following fields from the medical record document(s).
If a field is not present, return null.

Fields to extract:
${AdditionalMedicalRecordFields.map(field =>
  field.toLowerCase().includes("date")
    ? `- ${field} (YYYY-MM-DD)`
    : `- ${field}`
).join("\n")}

Rules:
- Only extract information explicitly present in the document(s).
- Do NOT guess or infer missing data.
- Always format date fields as YYYY-MM-DD.
- Return valid JSON with these keys only.
`;
		console.log("Fields to extract:", AdditionalMedicalRecordFields.join("\n- "));

		// Call Gemini API
		const genAI = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY")! });
		console.log("Gemini API Key:", Deno.env.get("GEMINI_API_KEY")!);
		const result = await genAI.models.generateContent({
			model: "gemini-2.5-pro",
			config: {
				temperature: 0,
				maxOutputTokens: 3000,
			},
			contents: [
				{
					role: "user",
					parts: [
						{ text: prompt },
						...files.map((file) => ({
							inlineData: {
								data: file.blobBase64, // already base64
								mimeType: file.type, // pass blob.type received from request
							},
						})),
					],
				},
			],
		});
		
		console.log("Sent request to Gemini with prompt:", prompt);
		console.log("OCR result:", result);

		const ocrText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
		console.log("OCR Text:", ocrText);

		// Remove code fences if present
		const cleanedOcrText = ocrText.replace(/```json|```/g, "").trim();
		let parsed: Record<string, string> | { raw: string };

		try {
			parsed = JSON.parse(cleanedOcrText);
		} catch {
			parsed = { raw: cleanedOcrText }; // fallback
		}

		return new Response(JSON.stringify({ extracted_data: parsed }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in OCR Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});