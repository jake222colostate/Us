import { getSupabaseClient } from '../api/supabase';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type PhotoRow = {
  id: string;
  user_id: string;
  url: string;
  storage_path?: string | null;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
  status: ModerationStatus;
  rejection_reason?: string | null;
  created_at?: string | null;
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
export const POST_PHOTO_BUCKET = 'post-photos';
export const ID_PHOTO_BUCKET = 'id-photos';

export function extractStoragePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = '/object/public/';
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const rest = url.slice(i + marker.length);
  const j = rest.indexOf('/');
  if (j === -1) return null;
  return rest.slice(j + 1);
}

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
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function createSignedPostPhotoUrl(
  storagePath: string | null,
  expiresInSeconds = 300,
): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.storage
      .from(POST_PHOTO_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function mapPhotoRow(row: PhotoRow): Promise<PhotoResource> {
  return {
    id: row.id,
    storagePath: row.storage_path ?? extractStoragePathFromPublicUrl(row.url),
    status: row.status,
    url: row.url ?? null,
    contentType: row.content_type ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    rejectionReason: row.rejection_reason ?? null,
  };
}

export async function mapPhotoRows(rows: PhotoRow[]): Promise<PhotoResource[]> {
  return Promise.all(rows.map((row) => mapPhotoRow(row)));
}
