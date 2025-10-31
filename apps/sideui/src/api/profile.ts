import type { Profile } from "@us/types";

import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import { mapProfileRow } from "./transformers";
import type { UpdateProfilePayload } from "../types";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 32);
}

export async function ensureProfile({
  userId,
  email,
  displayName,
  birthdate,
}: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  birthdate?: string | null;
}): Promise<Profile> {
  const client = requireSupabaseClient();

  const existing = await fetchProfile(userId);
  if (existing) {
    return existing;
  }

  const base = slugify(displayName || email?.split("@")[0] || `user-${userId.slice(0, 6)}` || "user");
  const profileBirthdate = birthdate ?? "1995-01-01";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    try {
      const { data, error } = await client
        .from("profiles")
        .insert({
          user_id: userId,
          username: candidate || `user-${userId.slice(0, 6)}`,
          display_name: displayName || candidate || "New Member",
          bio: null,
          birthdate: profileBirthdate,
          gender: null,
          looking_for: null,
          photo_urls: [],
          radius_km: 25,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        if (String(error.message).toLowerCase().includes("duplicate key") || error.code === "23505") {
          continue;
        }
        throw normalizeError(error, 400);
      }

      return mapProfileRow(data);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          continue;
        }
        throw error;
      }
      throw normalizeError(error, 400);
    }
  }

  throw new ApiError("Unable to create profile", 409, { userId });
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!data) return null;
    return mapProfileRow(data);
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function fetchProfileById(userId: string): Promise<Profile | null> {
  return fetchProfile(userId);
}

export async function updateProfile(userId: string, payload: UpdateProfilePayload): Promise<Profile> {
  const client = requireSupabaseClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(payload, "display_name")) {
    updates.display_name = payload.display_name ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "bio")) {
    updates.bio = payload.bio ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "looking_for")) {
    updates.looking_for = payload.looking_for ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "radius_km")) {
    updates.radius_km = payload.radius_km ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "photo_urls")) {
    updates.photo_urls = payload.photo_urls ?? [];
  }
  if (Object.prototype.hasOwnProperty.call(payload, "preferences")) {
    updates.preferences = payload.preferences ?? null;
  }

  try {
    const { data, error } = await client
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw normalizeError(error, 400);
    }

    if (data) {
      return mapProfileRow(data);
    }

    // If the profile does not exist yet, create one using defaults merged with payload
    const base = await ensureProfile({ userId, email: null, displayName: payload.display_name ?? null, birthdate: null });
    return base;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
