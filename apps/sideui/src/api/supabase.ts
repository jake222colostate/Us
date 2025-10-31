import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";

let client: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn("Supabase client is not fully configured. Falling back to demo data where possible.");
}

export function getSupabaseClient(): SupabaseClient | null {
  return client;
}

export function requireSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error("Supabase client is not configured");
  }
  return client;
}
