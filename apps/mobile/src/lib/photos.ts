import { getSupabaseClient } from '../api/supabase';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type PhotoRow = {
  id: string;
  user_id: string;
  url: string;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
  status: ModerationStatus;
};

export type PhotoResource = {
  id: string;
  storagePath: string | null;
  status: ModerationStatus;
  url: string | null;
  contentType: string | null;
  width: number | null;
  height: number | null;
  rejectionReason?: string | null;
  localUri?: string | null;
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

export function extractStoragePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${PROFILE_PHOTO_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return url.slice(index + marker.length);
}

export async function mapPhotoRow(row: PhotoRow): Promise<PhotoResource> {
  return {
    id: row.id,
    storagePath: extractStoragePathFromPublicUrl(row.url),
    status: row.status,
    url: row.url ?? null,
    contentType: row.content_type ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    rejectionReason: null,
  };
}

export async function mapPhotoRows(rows: PhotoRow[]): Promise<PhotoResource[]> {
  return Promise.all(rows.map((row) => mapPhotoRow(row)));
}
