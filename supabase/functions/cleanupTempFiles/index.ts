// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   	Deno.env.get("SUPABASE_URL")!,
// 		Deno.env.get("SUPABASE_ANON_KEY")!,
// );

// Deno.serve(async (req) => {
// 	const { data: files, error } = await supabase
//     .storage
//     .from("my-bucket")
//     .list("temp-uploads", { limit: 1000 });

//   if (error) {
//     console.error("Error listing files:", error);
//     return;
//   }

//   const now = Date.now();
//   const expiredFiles = files.filter(file => {
//     const created = new Date(file.created_at).getTime();
//     return now - created > 24 * 60 * 60 * 1000; // > 24 hours
//   });

//   for (const f of expiredFiles) {
//     await supabase.storage.from("my-bucket").remove([`temp-uploads/${f.name}`]);
//     console.log(`Deleted ${f.name}`);
//   }
// })