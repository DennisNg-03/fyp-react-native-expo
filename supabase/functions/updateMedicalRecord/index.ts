// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

import { AdditionalMedicalRecordField } from "../../../types/medicalRecord.ts";

type RequestBody = {
	record_id: string;
	title: string;
	record_type: string;
	record_date: string; // Will be destructured from ocrData
} & Partial<Record<AdditionalMedicalRecordField, string>>;

Deno.serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_ANON_KEY")!,
			{
				global: {
					headers: { Authorization: req.headers.get("Authorization")! },
				},
			}
		);

		const { record_id, title, record_type, record_date, ...ocrData } =
			(await req.json()) as RequestBody;
		console.log("Parsed request body:", {
			title,
			record_date,
		});
		console.log("OCR Data:", ocrData);

		if (!record_id) {
			return new Response("Missing record_id", { status: 400 });
		}

		// deno-lint-ignore no-explicit-any
		const updates: any = {};
		if (title) updates.title = title;
		if (record_type) updates.record_type = record_type;
		if (record_date) updates.record_date = record_date;

		for (const [key, value] of Object.entries(ocrData)) {
			if (value !== undefined) {
				updates[key] = value; // allows "" to clear value
			}
		}

		const { data, error } = await supabase
			.from("medical_records")
			.update(updates)
			.eq("id", record_id)
			.select()
			.single();

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
			});
		}

		return new Response(JSON.stringify({ data }), {
			headers: { "Content-Type": "application/json" },
		});
	// deno-lint-ignore no-explicit-any
	} catch (err: any) {
		console.error("Error in Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
