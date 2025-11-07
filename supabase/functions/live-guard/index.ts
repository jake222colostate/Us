import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GuardRequest = {
  userId?: string;
};

type GuardResponse = {
  allowed: boolean;
  nextAllowedAt?: string;
};

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

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as GuardRequest;
    const userId = body?.userId?.trim();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const now = new Date();
    const utcStart = startOfUtcDay(now).toISOString();
    const utcEnd = endOfUtcDay(now).toISOString();

    const { data, error } = await supabase
      .from("live_posts")
      .select("id, live_started_at")
      .eq("user_id", userId)
      .gte("live_started_at", utcStart)
      .lt("live_started_at", utcEnd)
      .order("live_started_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Failed to check live posts", error);
      return new Response(JSON.stringify({ error: "Unable to verify live quota" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const guard: GuardResponse = { allowed: true };

    if (data && data.length > 0) {
      const nextAllowedAt = endOfUtcDay(now).toISOString();
      guard.allowed = false;
      guard.nextAllowedAt = nextAllowedAt;
    }

    return new Response(JSON.stringify(guard), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("live-guard unexpected error", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
