// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service key for DB writes
);

Deno.serve(async (req) => {
  try {
    const { notification_id, user_id, appointment_id, title, body, type } = await req.json();
    console.log("Incoming push job:", { notification_id, user_id, appointment_id, type });

    if (!notification_id || !user_id || !appointment_id) {
      return new Response("Missing notification_id, user_id or appointment_id", { status: 400 });
    }

    // 1. Fetch device tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("user_device_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      console.log("No device tokens for user:", user_id);
      return new Response("No tokens", { status: 200 });
    }

    // 2. Send push notifcations via Expo Push API
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data: { notification_id, type, appointment_id },
    }));

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const expoResult = await expoRes.json();
    console.log("Expo response:", expoResult);

    // 3. Update notifications.sent_at
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", notification_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true, expoResult }), {
      headers: { "Content-Type": "application/json" },
    });
  // deno-lint-ignore no-explicit-any
  } catch (err: any) {
    console.error("sendPush error:", err);
    return new Response("Error: " + err.message, { status: 500 });
  }
});