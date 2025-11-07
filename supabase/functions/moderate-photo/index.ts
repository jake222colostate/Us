// Edge Function: moderate-photo
// Required environment variables:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - MODERATION_ENDPOINT (HTTP endpoint returning { nsfw_score: number })
//   - MODERATION_KEY (api key for the moderation provider)
//   - MODERATION_THRESHOLD (optional, defaults to 0.75)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ModerateRequest = {
  photoId: string;
  userId: string;
  publicUrl: string;
};

const MODERATION_ENDPOINT = Deno.env.get("MODERATION_ENDPOINT");
const MODERATION_KEY = Deno.env.get("MODERATION_KEY");
const MODERATION_THRESHOLD = Number(Deno.env.get("MODERATION_THRESHOLD") ?? "0.75");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ModerateRequest;
    if (!body?.photoId || !body?.userId || !body?.publicUrl) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    let nsfwScore = 0;
    if (MODERATION_ENDPOINT && MODERATION_KEY) {
      const response = await fetch(MODERATION_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MODERATION_KEY}`,
        },
        body: JSON.stringify({
          image_url: body.publicUrl,
        }),
      });

      if (!response.ok) {
        console.error("Moderation provider error", await response.text());
        return new Response(JSON.stringify({ error: "Moderation provider error" }), {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      const result = (await response.json()) as { nsfw_score?: number };
      nsfwScore = typeof result.nsfw_score === "number" ? result.nsfw_score : 0;
    } else {
      console.warn("Moderation endpoint or key missing; defaulting to approval");
    }

    const status = nsfwScore >= MODERATION_THRESHOLD ? "rejected" : "approved";

    const { error: updateError } = await supabase
      .from("photos")
      .update({ status })
      .eq("id", body.photoId)
      .eq("user_id", body.userId);

    if (updateError) {
      console.error("Failed to update photo status", updateError);
      return new Response(JSON.stringify({ error: "Failed to update photo status" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ status, nsfwScore }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
