import type { Heart, Match, Post, Profile } from "@us/types";

function parseCoordinates(value: any): Profile["location"] {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const [longitude, latitude] = value as [number, number];
    return { latitude, longitude };
  }
  if (typeof value === "object") {
    const maybeCoords = (value as any).coordinates;
    if (Array.isArray(maybeCoords) && maybeCoords.length >= 2) {
      const [longitude, latitude] = maybeCoords as [number, number];
      return { latitude, longitude };
    }
    if (typeof (value as any).latitude === "number" && typeof (value as any).longitude === "number") {
      return { latitude: (value as any).latitude, longitude: (value as any).longitude };
    }
  }
  return null;
}

export function mapProfileRow(row: any): Profile {
  return {
    user_id: row.user_id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio ?? null,
    birthdate: typeof row.birthdate === "string" ? row.birthdate : new Date(row.birthdate).toISOString(),
    gender: row.gender ?? null,
    looking_for: row.looking_for ?? null,
    photo_urls: Array.isArray(row.photo_urls) ? (row.photo_urls as string[]) : [],
    location: parseCoordinates(row.location),
    radius_km: typeof row.radius_km === "number" ? row.radius_km : Number(row.radius_km ?? 0),
    preferences: row.preferences ?? null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date(row.updated_at).toISOString(),
  };
}

export function mapPostRow(row: any, profile?: Profile | null): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    photo_url: row.photo_url,
    caption: row.caption ?? null,
    location: parseCoordinates(row.location),
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    profile: profile ?? (row.profile ? mapProfileRow(row.profile) : undefined),
  };
}

export function mapHeartRow(row: any): Heart {
  return {
    id: row.id,
    post_id: row.post_id,
    from_user: row.from_user,
    to_user: row.to_user,
    kind: row.kind ?? "normal",
    paid: Boolean(row.paid),
    message: row.message ?? null,
    selfie_url: row.selfie_url ?? null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    post: row.post ? mapPostRow(row.post) : undefined,
    profile: row.profile ? mapProfileRow(row.profile) : undefined,
  };
}

export function mapMatchRow(row: any): Match {
  return {
    id: row.id,
    user_a: row.user_a,
    user_b: row.user_b,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
  };
}
