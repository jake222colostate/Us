import type { ProfilePhoto } from "@us/types";

import { PROFILE_STORAGE_BUCKET } from "../config";
import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import { mapPhotoRow } from "./transformers";

function createFileName(userId: string, extension = "jpg"): string {
  const sanitizedExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const slug = Math.random().toString(36).slice(2, 10);
  return `${userId}/${Date.now()}-${slug}.${sanitizedExt}`;
}

async function syncPhotoUrls(userId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("user_photos")
    .select("url, is_primary, is_verification_photo")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    throw normalizeError(error, 400);
  }

  const urls = (data ?? [])
    .filter((row: any) => !row.is_verification_photo && typeof row.url === "string" && row.url.length > 0)
    .map((row: any) => row.url as string);

  const { error: updateError } = await client
    .from("profiles")
    .update({ photo_urls: urls, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (updateError) {
    throw normalizeError(updateError, 400);
  }
}

export async function uploadProfilePhoto({
  userId,
  file,
  isPrimary = false,
  isVerificationPhoto = false,
}: {
  userId: string;
  file: File | Blob;
  isPrimary?: boolean;
  isVerificationPhoto?: boolean;
}): Promise<ProfilePhoto> {
  const client = requireSupabaseClient();
  const bucket = PROFILE_STORAGE_BUCKET;
  const contentType = (file as File).type || "image/jpeg";
  const extension = contentType.split("/").pop() || "jpg";
  const path = createFileName(userId, extension);

  const { error: uploadError } = await client.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (uploadError) {
    throw normalizeError(uploadError, 400);
  }

  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(path);

  const { data, error } = await client
    .from("user_photos")
    .insert({
      user_id: userId,
      storage_path: path,
      url: publicUrl,
      is_primary: isPrimary,
      is_verification_photo: isVerificationPhoto,
    })
    .select("*")
    .single();

  if (error) {
    throw normalizeError(error, 400);
  }

  const photo = mapPhotoRow(data);

  if (isPrimary && !isVerificationPhoto) {
    await client
      .from("user_photos")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .neq("id", photo.id)
      .eq("is_verification_photo", false);
  }

  if (!isVerificationPhoto) {
    await syncPhotoUrls(userId);
  }

  return photo;
}

export async function setPrimaryPhoto(userId: string, photoId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error: updateError } = await client
    .from("user_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .eq("user_id", userId)
    .eq("is_verification_photo", false);
  if (updateError) {
    throw normalizeError(updateError, 400);
  }

  const { error: clearError } = await client
    .from("user_photos")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .neq("id", photoId)
    .eq("is_verification_photo", false);
  if (clearError) {
    throw normalizeError(clearError, 400);
  }

  await syncPhotoUrls(userId);
}

export async function removePhoto(userId: string, photoId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { data, error } = await client.from("user_photos").select("storage_path, is_verification_photo").eq("id", photoId).maybeSingle();
  if (error) {
    throw normalizeError(error, 400);
  }
  if (!data) {
    throw new ApiError("Photo not found", 404, { photoId });
  }

  const { error: deleteError } = await client.from("user_photos").delete().eq("id", photoId).eq("user_id", userId);
  if (deleteError) {
    throw normalizeError(deleteError, 400);
  }

  if (data.storage_path) {
    await client.storage.from(PROFILE_STORAGE_BUCKET).remove([data.storage_path as string]);
  }

  if (!data.is_verification_photo) {
    await syncPhotoUrls(userId);
  }
}
