import { getSupabaseClient } from './supabase';
import { POST_PHOTO_BUCKET, extractStoragePathFromPublicUrl } from '../lib/photos';

export type Post = {
  id: string;
  user_id: string;
  photo_url: string;
  created_at: string;
  storage_path?: string | null;
  caption?: string | null;
};

type CreatePostArgs = {
  userId: string;
  photoUrl: string;
  storagePath?: string | null;
};

function mapPostRow(row: Record<string, unknown>): Post {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    photo_url: String(row.photo_url ?? ''),
    created_at: String(row.created_at ?? new Date().toISOString()),
    storage_path: (row.storage_path as string | null | undefined) ?? null,
    caption: (row.caption as string | null | undefined) ?? null,
  };
}

export async function createPost({ userId, photoUrl, storagePath }: CreatePostArgs): Promise<void> {
  const client = getSupabaseClient();
  const payload: Record<string, unknown> = { user_id: userId, photo_url: photoUrl };
  if (storagePath) {
    payload.storage_path = storagePath;
  }

  let { error } = await client.from('posts').insert(payload);

  if (error && error.code === '42703' && error.message?.toLowerCase().includes('storage_path')) {
    delete payload.storage_path;
    ({ error } = await client.from('posts').insert(payload));
  }

  if (error) {
    if (error.code === '42P01' || /relation "posts" does not exist/i.test(error.message ?? '')) {
      console.warn('posts table missing; skipping insert');
      return;
    }
    throw error;
  }
}

export async function listRecentPosts(limit = 50): Promise<Post[]> {
  const client = getSupabaseClient();
  const baseQuery = client
    .from('posts')
    .select('id,user_id,photo_url,created_at,storage_path,caption')
    .order('created_at', { ascending: false })
    .limit(limit);

  let { data, error } = await baseQuery.is('deleted_at', null);
  if (error && error.code === '42703' && error.message?.toLowerCase().includes('deleted_at')) {
    ({ data, error } = await client
      .from('posts')
      .select('id,user_id,photo_url,created_at,storage_path,caption')
      .order('created_at', { ascending: false })
      .limit(limit));
  }

  if (error) throw error;
  return (data ?? []).map((row) => mapPostRow(row as Record<string, unknown>));
}

export async function listUserPosts(userId: string, limit = 50): Promise<Post[]> {
  const client = getSupabaseClient();
  const baseQuery = client
    .from('posts')
    .select('id,user_id,photo_url,created_at,storage_path,caption')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  let { data, error } = await baseQuery.is('deleted_at', null);
  if (error && error.code === '42703' && error.message?.toLowerCase().includes('deleted_at')) {
      ({ data, error } = await client
        .from('posts')
        .select('id,user_id,photo_url,created_at,storage_path,caption')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit));
  }

  if (error) throw error;
  return (data ?? []).map((row) => mapPostRow(row as Record<string, unknown>));
}

export async function deletePost({
  postId,
  photoUrl,
}: {
  postId: string;
  photoUrl?: string | null;
}): Promise<void> {
  const client = getSupabaseClient();
  let storagePath = extractStoragePathFromPublicUrl(photoUrl ?? null);

  if (!storagePath) {
    const { data: row, error: fetchError } = await client
      .from('posts')
      .select('storage_path, photo_url')
      .eq('id', postId)
      .maybeSingle();
    if (!fetchError && row) {
      storagePath =
        (row.storage_path as string | null | undefined) ?? extractStoragePathFromPublicUrl((row.photo_url as string | null) ?? null);
    }
  }

  if (storagePath) {
    const { error: storageError } = await client.storage.from(POST_PHOTO_BUCKET).remove([storagePath]);
    if (storageError && storageError.message && !/not found/i.test(storageError.message)) {
      console.warn('Failed to remove storage object for post', storageError);
    }
  }

  const { error } = await client.from('posts').delete().eq('id', postId);
  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (storagePath) {
    try {
      await client.from('photos').delete().eq('storage_path', storagePath);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '42P01') {
        console.warn('photos table missing; skipping mirror delete');
      }
    }
  }
}
