import type { Heart, Match, Post, Profile, ProfilePhoto } from "@us/types";

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

function mapPhotoRow(row: any): ProfilePhoto {
  return {
    id: row.id,
    user_id: row.user_id,
    url: row.url,
    storage_path: row.storage_path ?? row.url,
    is_primary: Boolean(row.is_primary),
    is_verification_photo: Boolean(row.is_verification_photo),
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
  };
}

function resolveAge(row: any): number | null {
  if (typeof row.age === "number") {
    return Number.isFinite(row.age) ? row.age : null;
  }
  if (row.birthdate) {
    const date = new Date(row.birthdate);
    if (!Number.isNaN(date.getTime())) {
      const diff = Date.now() - date.getTime();
      if (diff > 0) {
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
      }
    }
  }
  return null;
}

export function mapProfileRow(row: any): Profile {
  const photosSource = Array.isArray(row.photos)
    ? row.photos
    : Array.isArray(row.user_photos)
      ? row.user_photos
      : [];

  const photos = photosSource
    .map((photo: any) => mapPhotoRow(photo))
    .filter((photo) => Boolean(photo.url));

  return {
    id: row.user_id ?? row.id,
    user_id: row.user_id ?? row.id,
    email: row.email ?? null,
    username: row.handle ?? row.username ?? `user-${(row.user_id ?? row.id ?? "").slice(0, 6)}`,
    display_name: row.display_name ?? row.username ?? "New member",
    bio: row.bio ?? null,
    birthdate:
      row.birthdate
        ? typeof row.birthdate === "string"
          ? row.birthdate
          : new Date(row.birthdate).toISOString()
        : null,
    age: resolveAge(row),
    gender: row.gender ?? null,
    looking_for: row.looking_for ?? null,
    location: parseCoordinates(row.location),
    location_text: row.location_text ?? null,
    radius_km: typeof row.radius_km === "number" ? row.radius_km : Number(row.radius_km ?? 0),
    interests: Array.isArray(row.interests)
      ? (row.interests as unknown[]).filter((value): value is string => typeof value === "string")
      : [],
    verification_status: row.verification_status ?? "unverified",
    is_active: row.is_active !== false,
    preferences: row.preferences ?? null,
    photos,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date(row.updated_at).toISOString(),
  };
}

export function mapPostRow(row: any, profile?: Profile | null): Post {
  const resolvedProfile = profile ?? (row.profile ? mapProfileRow(row.profile) : undefined);
  const primaryPhoto =
    row.photo_url ??
    resolvedProfile?.photos.find((photo) => photo.is_primary)?.url ??
    resolvedProfile?.photos.find((photo) => !photo.is_verification_photo)?.url ??
    (Array.isArray(row.photo_urls) ? row.photo_urls[0] : undefined);

  return {
    id: row.id,
    user_id: row.user_id,
    photo_url: primaryPhoto ?? "",
    caption: row.caption ?? null,
    location: parseCoordinates(row.location),
    created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    profile: resolvedProfile,
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
    matched_at:
      typeof row.matched_at === "string"
        ? row.matched_at
        : row.matched_at
          ? new Date(row.matched_at).toISOString()
          : typeof row.created_at === "string"
            ? row.created_at
            : new Date(row.created_at).toISOString(),
    last_message_at:
      typeof row.last_message_at === "string"
        ? row.last_message_at
        : row.last_message_at
          ? new Date(row.last_message_at).toISOString()
          : null,
  };
}

export { mapPhotoRow };
