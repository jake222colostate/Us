import { getSupabaseClient } from '../api/supabase';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type PhotoRow = {
  id: string;
  user_id: string;
  url: string;
  status: ModerationStatus;
  rejection_reason?: string | null;
};

export type PhotoResource = {
  id: string;
  storagePath: string;
  status: ModerationStatus;
  rejectionReason?: string | null;
  url: string | null;
};

export const PROFILE_PHOTO_BUCKET = 'profile-photos';

export async function createSignedPhotoUrl(
  storagePath: string | null,
  expiresInSeconds = 300,
): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.storage
      .from(PROFILE_PHOTO_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error) {
      console.warn('Failed to create signed URL', error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (error) {
    console.warn('Failed to sign storage path', error);
    return null;
  }
}

export async function mapPhotoRow(row: PhotoRow): Promise<PhotoResource> {
  return {
    id: row.id,
    storagePath: row.url,
    status: row.status,
    rejectionReason: row.rejection_reason ?? null,
    url: await createSignedPhotoUrl(row.url),
  };
}

export async function mapPhotoRows(rows: PhotoRow[]): Promise<PhotoResource[]> {
  return Promise.all(rows.map((row) => mapPhotoRow(row)));
}
