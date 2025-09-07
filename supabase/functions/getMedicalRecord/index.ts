// deno-lint-ignore-file no-explicit-any
// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

import { SelectedFile } from "../../../types/medicalRecord.ts";

Deno.serve(async (req) => {
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	try {
		const url = new URL(req.url);
		const uid = url.searchParams.get("uid");
		const role = url.searchParams.get("role");
		if (!uid) return new Response("Missing uid", { status: 400 });
		if (!role) return new Response("Missing role", { status: 400 });

		const page = Number(url.searchParams.get("page") ?? "1");
		const limit = Number(url.searchParams.get("limit") ?? "10"); // default 10 per page
		const offset = (page - 1) * limit;

		// Get data from medical_records table in db
		if (role === "patient") {
			const { data: records, error } = await supabase
				.from("medical_records")
				.select("*")
				.eq("patient_id", uid)
				.order("record_date", { ascending: false })
				.order("updated_at", { ascending: false })
				.range(offset, offset + limit - 1); // For handling pagination of infinite scroll

			if (error)
				return new Response("DB error: " + error.message, { status: 500 });
			if (!records || records.length === 0)
				return new Response(JSON.stringify({ signedUrls: [] }), {
					status: 200,
				});

			const recordsWithUrls = await Promise.all(
				records.map(async (record) => {
					const files: SelectedFile[] = record.file_paths ?? [];
					console.log("Record.file_paths:", files);

					// Get signed URLs for all the files
					const signedUrls = await Promise.all(
						files.map(async (file) => {
							const { data, error } = await supabase.storage
								.from("medical-records")
								.createSignedUrl(file.uri, 60 * 60);
							if (error || !data) {
								console.error("Error creating signed URL:", error);
								return new Response(
									`Failed to create signed URL for ${file}.` + error.message,
									{ status: 500 }
								);
							}
							return data.signedUrl;
						})
					);

					const { id, title, record_type, patient_id, file_paths, ...ocrData } =
						record;

					return {
						id,
						title,
						record_type,
						patient_id,
						file_paths: file_paths as SelectedFile[],
						signed_urls: signedUrls,
						...ocrData,
					};
				})
			);

			console.log(
				"Page:",
				page,
				"Records:",
				recordsWithUrls.map((r) => r.id)
			);

			const hasMore = records.length === limit;

			return new Response(JSON.stringify({ recordsWithUrls, hasMore }), {
				headers: { "Content-Type": "application/json" },
			});
		} else if (role === "doctor" || role === "nurse") {
			// Doctor: only records with explicit access granted
			let effectiveDoctorId = uid;

			if (role === "nurse") {
				// Fetch assigned doctor for the nurse
				const { data: nurseData, error: nurseError } = await supabase
					.from("nurses")
					.select("assigned_doctor_id")
					.eq("id", uid)
					.single();

				if (nurseError)
					return new Response("DB error: " + nurseError.message, {
						status: 500,
					});
				if (!nurseData?.assigned_doctor_id)
					return new Response("No assigned doctor", { status: 403 });

				effectiveDoctorId = nurseData.assigned_doctor_id;
			}

			// Fetch all patient_access rows for this doctor, ordered by created_at desc
			const { data: accessData, error: accessError } = await supabase
				.from("patient_access")
				.select("patient_id, grant_status, created_at")
				.eq("doctor_id", effectiveDoctorId)
				.order("created_at", { ascending: false });

			if (accessError)
				return new Response("DB error: " + accessError.message, {
					status: 500,
				});

			// Keep only the latest access per patient
			const latestAccessMap: Record<string, any> = {};
			(accessData ?? []).forEach((row: any) => {
				if (!latestAccessMap[row.patient_id]) {
					latestAccessMap[row.patient_id] = row;
				}
			});

			// Only patients with grant_status = true
			const allowedPatientIds = Object.values(latestAccessMap)
				.filter((row: any) => row.grant_status)
				.map((row: any) => row.patient_id);

			if (allowedPatientIds.length === 0)
				return new Response(JSON.stringify({ recordsWithUrls: [] }), {
					status: 200,
				});

			// Fetch medical records for these patient IDs
			const { data: records, error } = await supabase
				.from("medical_records")
				.select("*")
				.in("patient_id", allowedPatientIds)
				.order("record_date", { ascending: false })
				.order("updated_at", { ascending: false })
				.range(offset, offset + limit - 1);

			if (error)
				return new Response("DB error: " + error.message, { status: 500 });

			const recordsWithUrls = await Promise.all(
				records.map(async (record) => {
					const files: SelectedFile[] = record.file_paths ?? [];
					const signedUrls = await Promise.all(
						files.map(async (file) => {
							const { data, error } = await supabase.storage
								.from("medical-records")
								.createSignedUrl(file.uri, 60 * 60);
							if (error || !data) return null;
							return data.signedUrl;
						})
					);

					const { id, title, record_type, patient_id, file_paths, ...ocrData } =
						record;
					return {
						id,
						title,
						record_type,
						patient_id,
						file_paths: file_paths as SelectedFile[],
						signed_urls: signedUrls,
						...ocrData,
					};
				})
			);

			const hasMore = records.length === limit;

			return new Response(JSON.stringify({ recordsWithUrls, hasMore }), {
				headers: { "Content-Type": "application/json" },
			});

		} else {
			return new Response("Invalid role", { status: 400 });
		}
	} catch (err: any) {
		console.error("Error in getMedicalRecord Edge Function:", err);
		return new Response("Error: " + err.message, { status: 500 });
	}
});
