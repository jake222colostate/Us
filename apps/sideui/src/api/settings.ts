import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import type { UserSettings } from "../types";

function mapSettings(row: any): UserSettings {
  return {
    user_id: row.user_id,
    email_updates: Boolean(row.email_updates ?? true),
    push_notifications: Boolean(row.push_notifications ?? true),
    safe_mode: Boolean(row.safe_mode ?? false),
    commitment: row.commitment ?? null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date(row.updated_at).toISOString(),
  };
}

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) {
      throw normalizeError(error, 400);
    }
    return data ? mapSettings(data) : null;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function upsertUserSettings(
  userId: string,
  settings: Partial<Pick<UserSettings, "email_updates" | "push_notifications" | "safe_mode" | "commitment">>
): Promise<UserSettings> {
  const client = requireSupabaseClient();
  const payload = {
    user_id: userId,
    email_updates: settings.email_updates ?? true,
    push_notifications: settings.push_notifications ?? true,
    safe_mode: settings.safe_mode ?? false,
    commitment: settings.commitment ?? null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await client
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) {
      throw normalizeError(error, 400);
    }
    return mapSettings(data);
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
