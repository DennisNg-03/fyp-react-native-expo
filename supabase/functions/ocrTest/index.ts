// eslint-disable-next-line import/no-unresolved
import { GoogleGenAI } from "npm:@google/genai";

import {
	DischargeSummaryFields,
	ImagingReportFields,
	LabResultFields,
	PrescriptionFields,
} from "../../../types/medicalRecord.ts";

type IncomingFile = {
	name: string;
	blobBase64: string;
	type: "image" | "document";
};

Deno.serve(async (req) => {
	try {
		const { files, title, date, record_type } = (await req.json()) as {
			files: IncomingFile[];
			title: string;
			date: string;
			record_type: string;
		};
		console.log("Parsed request body:", {
			files,
			title,
			date,
			record_type,
		});

		// Convert files to ArrayBuffer
		const fileParts = files.map((file) => {
			// Decode base64 → Uint8Array
			const fileBytes = Uint8Array.from(atob(file.blobBase64), (c) =>
				c.charCodeAt(0)
			);

			console.log(
				`Converted file ${file.name} to Uint8Array of length ${fileBytes.length}`
			);

			return fileBytes.buffer; // ArrayBuffer
		});

		// let fieldsToExtract: LabResultField[] | PrescriptionField[] | ImagingReportField[] | DischargeSummaryField[];
		// let fieldsToExtract: string[] = [];
		let fieldsToExtract;

		switch (record_type) {
			case "lab_result":
				fieldsToExtract = LabResultFields;
				break;
			case "prescription":
				fieldsToExtract = PrescriptionFields;
				break;
			case "imaging_report":
				fieldsToExtract = ImagingReportFields;
				break;
			case "discharge_summary":
				fieldsToExtract = DischargeSummaryFields;
				break;
			default:
				fieldsToExtract = [];
		}

		console.log("fields to Extract:", fieldsToExtract);

		// const urlsList = signedUrls
		// 	.map((url: string, i: number) => `Image ${i + 1}: ${url}`)
		// 	.join("\n");
		// console.log("URLs List:", urlsList);

		// if (!signedUrls || signedUrls.length === 0) {
		// 	return new Response("Missing signedUrls", { status: 400 });
		// }

		// if (!fieldsToExtract || fieldsToExtract.length === 0) {
		// 	return new Response("Missing fieldsToExtract", { status: 400 });
		// }

		const prompt = `
		Extract all text from the medical record image(s) using the URLs given.

		Identify the following fields: ${fieldsToExtract.join(", ")}.

		Strict rules:
		- Only extract information that is explicitly present in the document(s).
		- Do NOT invent or guess values.
		- If a field is not found, set its value to null.
		- Output MUST be valid JSON with keys matching the requested fields, and no extra keys.
`;

		const contents = [
			{
				role: "user",
				parts: [
					{
						text: `
              Extract all text from the medical record image(s).

              Identify the following fields: ${fieldsToExtract.join(", ")}.

              Strict rules:
              - Only extract information explicitly present in the document(s).
              - Do NOT invent or guess values.
              - If a field is not found, set its value to null.
              - Output MUST be valid JSON with keys matching the requested fields, and no extra keys.
            `,
					},
					...files.map((file) => ({
						inlineData: {
							data: file.blobBase64, // already base64
							mimeType: file.type, // e.g. "image/png" or "application/pdf"
						},
					})),
				],
			},
		];

		// Call Gemini OCR directly using the signed URL
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
						{
							text: `Extract all text from the medical record image(s).
Identify the following fields: ${fieldsToExtract.join(", ")}.

Rules:
- Only extract explicitly present data.
- No guessing values.
- If missing, set value to null.
- Output valid JSON only.`,
						},
						...files.map((file) => ({
							inlineData: {
								mimeType:
									file.type === "image" ? "image/png" : "application/pdf",
								data: file.blobBase64, // already base64
							},
						})),
					],
				},
			],
			// contents: [
			// 	{ role: "user", parts: [{ text: prompt }, ...fileParts] },
			// ],
		});
		console.log("Sent request to Gemini with prompt:", prompt);
		console.log("OCR result:", result);

		const ocrText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
		console.log("OCR Text:", ocrText);
		let parsed: Record<string, string> | { raw: string };

		// const text = result.response?.text() ?? "";

		try {
			parsed = JSON.parse(ocrText);
		} catch {
			parsed = { raw: ocrText }; // fallback
		}

		return new Response(JSON.stringify({ parsed }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		console.error("Error in OCR Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
