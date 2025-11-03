import type { VerificationRecord, VerificationStatus } from "@us/types";

import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import { uploadProfilePhoto } from "./photos";

export async function submitPhotoVerification({
  userId,
  file,
}: {
  userId: string;
  file: File | Blob;
}): Promise<VerificationRecord> {
  const client = requireSupabaseClient();
  const photo = await uploadProfilePhoto({ userId, file, isVerificationPhoto: true, isPrimary: false });

  const { data, error } = await client
    .from("verifications")
    .insert({
      user_id: userId,
      type: "photo",
      status: "pending",
      asset_paths: [photo.storage_path],
      asset_urls: [photo.url],
    })
    .select("*")
    .single();

  if (error) {
    throw normalizeError(error, 400);
  }

  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    status: data.status,
    asset_paths: data.asset_paths ?? [],
    asset_urls: data.asset_urls ?? [],
    submitted_at: data.submitted_at,
    reviewed_at: data.reviewed_at ?? null,
    reviewer_id: data.reviewer_id ?? null,
    reviewer_note: data.reviewer_note ?? null,
  };
}

export async function submitIdVerification({
  userId,
  front,
  back,
}: {
  userId: string;
  front: File | Blob;
  back: File | Blob;
}): Promise<VerificationRecord> {
  const client = requireSupabaseClient();
  const [frontPhoto, backPhoto] = await Promise.all([
    uploadProfilePhoto({ userId, file: front, isVerificationPhoto: true }),
    uploadProfilePhoto({ userId, file: back, isVerificationPhoto: true }),
  ]);

  const { data, error } = await client
    .from("verifications")
    .insert({
      user_id: userId,
      type: "id",
      status: "pending",
      asset_paths: [frontPhoto.storage_path, backPhoto.storage_path],
      asset_urls: [frontPhoto.url, backPhoto.url],
    })
    .select("*")
    .single();

  if (error) {
    throw normalizeError(error, 400);
  }

  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    status: data.status,
    asset_paths: data.asset_paths ?? [],
    asset_urls: data.asset_urls ?? [],
    submitted_at: data.submitted_at,
    reviewed_at: data.reviewed_at ?? null,
    reviewer_id: data.reviewer_id ?? null,
    reviewer_note: data.reviewer_note ?? null,
  };
}

export async function listPendingVerifications(): Promise<VerificationRecord[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("verifications")
    .select("*")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });
  if (error) {
    throw normalizeError(error, 400);
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    status: row.status,
    asset_paths: row.asset_paths ?? [],
    asset_urls: row.asset_urls ?? [],
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at ?? null,
    reviewer_id: row.reviewer_id ?? null,
    reviewer_note: row.reviewer_note ?? null,
  }));
}

export async function updateVerification({
  verificationId,
  status,
  reviewerId,
  note,
}: {
  verificationId: string;
  status: VerificationStatus;
  reviewerId: string;
  note?: string | null;
}): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client
    .from("verifications")
    .update({
      status: status === "verified" ? "approved" : status === "rejected" ? "rejected" : "pending",
      reviewer_id: reviewerId,
      reviewer_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId);
  if (error) {
    throw normalizeError(error, 400);
  }
}

export async function fetchLatestVerification(userId: string): Promise<VerificationRecord | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("verifications")
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw normalizeError(error, 400);
  }
  if (!data) return null;
  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    status: data.status,
    asset_paths: data.asset_paths ?? [],
    asset_urls: data.asset_urls ?? [],
    submitted_at: data.submitted_at,
    reviewed_at: data.reviewed_at ?? null,
    reviewer_id: data.reviewer_id ?? null,
    reviewer_note: data.reviewer_note ?? null,
  };
}
