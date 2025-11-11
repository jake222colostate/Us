// supabase/functions/moderate-photo/index.ts
// Phase 1: fast-approve stub (we’ll wire real moderation next)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { photo_id } = await req.json();
    if (!photo_id) {
      return new Response(JSON.stringify({ error: "photo_id required" }), { status: 400 });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const url = Deno.env.get("SUPABASE_URL")!;

    const resp = await fetch(`${url}/rest/v1/photos?id=eq.${photo_id}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "approved",
        moderated_at: new Date().toISOString(),
        moderation_labels: [],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: "DB update failed", details: txt }), { status: 500 });
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
