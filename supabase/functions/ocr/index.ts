// eslint-disable-next-line import/no-unresolved
import { GoogleGenAI } from "npm:@google/genai";

import {
	DischargeSummaryFields,
	ImagingReportFields,
	LabResultFields,
	PrescriptionFields,
} from "../../../types/medicalRecord.ts";

Deno.serve(async (req) => {
	// const supabase = createClient(
	// 	Deno.env.get("SUPABASE_URL")!,
	// 	Deno.env.get("SUPABASE_ANON_KEY")!,
	// 	{
	// 		global: {
	// 			headers: { Authorization: req.headers.get("Authorization")! },
	// 		},
	// 	}
	// );

	try {
		const { signedUrls, title, date, record_type } = await req.json();
		console.log("Parsed request body:", {
			signedUrls,
			title,
			date,
			record_type,
		});

		let fieldsToExtract;

		switch (record_type) {
			case "Lab Result":
				fieldsToExtract = LabResultFields;
				break;
			case "Prescription":
				fieldsToExtract = PrescriptionFields;
				break;
			case "Imaging Report":
				fieldsToExtract = ImagingReportFields;
				break;
			case "Discharge Summary":
				fieldsToExtract = DischargeSummaryFields;
				break;
			default:
				fieldsToExtract = [];
		}

		console.log("fields to Extract:", fieldsToExtract);

		const urlsList = signedUrls
			.map((url: string, i: number) => `Image ${i + 1}: ${url}`)
			.join("\n");
		console.log("URLs List:", urlsList);

		if (!signedUrls || signedUrls.length === 0) {
			return new Response("Missing signedUrls", { status: 400 });
		}

		if (!fieldsToExtract || fieldsToExtract.length === 0) {
			return new Response("Missing fieldsToExtract", { status: 400 });
		}

		const prompt = `
		Extract all text from the medical record image(s) using the URLs given.

		Identify the following fields: ${fieldsToExtract.join(", ")}.

		Strict rules:
		- Only extract information that is explicitly present in the document(s).
		- Do NOT invent or guess values.
		- If a field is not found, set its value to null.
		- Output MUST be valid JSON with keys matching the requested fields, and no extra keys.
		
		Input images:
		${urlsList}`;

		// Call Gemini OCR directly using the signed URL
		const genAI = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY")! });
		console.log("Gemini API Key:", Deno.env.get("GEMINI_API_KEY")!);
		const result = await genAI.models.generateContent({
			model: "gemini-2.5-pro",
			config: {
				temperature: 1,
				maxOutputTokens: 2000,
			},
			contents: prompt,
		});
		console.log("OCR result:", result);

		const ocrText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
		console.log("OCR Text:", ocrText);

		return new Response(JSON.stringify({ ocrText }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in OCR Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
