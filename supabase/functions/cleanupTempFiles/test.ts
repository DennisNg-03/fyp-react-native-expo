// import { MultipartReader } from "https://deno.land/std@0.224.0/mime/multipart.ts";

// Deno.serve(async (req) => {
//   const contentType = req.headers.get("content-type")!;
//   const boundary = contentType.split("boundary=")[1];
//   const body = req.body!;
//   const mr = new MultipartReader(body, boundary);
//   const form = await mr.readForm();

//   // normal fields
//   const doctor_id = form.value("doctor_id");
//   const patient_id = form.value("patient_id");

//   // files
//   const files = form.files("supporting_documents[0]"); // or loop indexes

//   // metadata
//   const metaRaw = form.value("supporting_documents_meta[0]");
//   const meta = metaRaw ? JSON.parse(metaRaw) : null;

//   return new Response(JSON.stringify({
//     doctor_id,
//     patient_id,
//     file_count: files?.length ?? 0,
//     meta,
//   }), { status: 200 });
// });