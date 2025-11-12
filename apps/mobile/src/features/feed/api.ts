import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../api/supabase';
import { POST_LIKE_KIND, isLikeKindColumnMissing } from '../../api/postLikes';
import { isTableMissingError, logTableMissingWarning } from '../../api/postgrestErrors';

export type FeedPost = {
  id: string;
  user_id: string;
  photo_url: string;     // canonical
  image_url?: string;    // alias for older components
  storage_path?: string | null;
  created_at: string;
  caption?: string | null;
  like_count?: number;
  liked_by_viewer?: boolean;
  profile?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
};

function shouldIgnoreMissingColumn(error: PostgrestError | null | undefined, column: string) {
  return Boolean(error && error.code === '42703' && error.message?.toLowerCase().includes(column));
}

export async function fetchFeed(opts?: {
  limit?: number;
  offset?: number;
  viewerId?: string;   // reserved for later filters
  radiusKm?: number;   // reserved for later filters
}) {
  const limit = opts?.limit ?? 12;
  const offset = opts?.offset ?? 0;
  const client = getSupabaseClient();

  // Simple newest-first feed directly from public.posts
  const selectColumns = `
      id,
      user_id,
      photo_url,
      storage_path,
      image_url:photo_url,
      created_at,
      caption,
      profile:profiles (
        id,
        display_name,
        avatar_url
      )
    `;

  const baseQuery = client
    .from('posts')
    .select(selectColumns)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  let { data, error } = await baseQuery.is('deleted_at', null);
  if (error && shouldIgnoreMissingColumn(error, 'deleted_at')) {
    ({ data, error } = await client
      .from('posts')
      .select(selectColumns)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1));
  }

  if (error) throw error;

  let rows = (data ?? []) as FeedPost[];

  if (!rows.length) {
    return rows;
  }

  const storagePaths = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.storage_path === 'string' ? row.storage_path.trim() : ''))
        .filter((path) => path.length > 0),
    ),
  );

  const urlFallbacks = Array.from(
    new Set(
      rows
        .filter((row) => {
          const path = typeof row.storage_path === 'string' ? row.storage_path.trim() : '';
          const url = typeof row.photo_url === 'string' ? row.photo_url.trim() : '';
          return !path && url.length > 0;
        })
        .map((row) => row.photo_url.trim()),
    ),
  );

  const approvedStorage = new Set<string>();
  const approvedUrls = new Set<string>();

  const approvalTasks: Promise<void>[] = [];

  if (storagePaths.length) {
    approvalTasks.push(
      (async () => {
        const { data: photoRows, error: photoError } = await client
          .from('photos')
          .select('storage_path, status')
          .in('storage_path', storagePaths);
        if (photoError) {
          if (isTableMissingError(photoError, 'photos')) {
            logTableMissingWarning('photos', photoError);
            storagePaths.forEach((path) => approvedStorage.add(path));
            return;
          }
          throw photoError;
        }

        (photoRows ?? []).forEach((row) => {
          const status = (row as { status?: string }).status;
          const path = (row as { storage_path?: string | null }).storage_path;
          if (status === 'approved' && typeof path === 'string') {
            const trimmed = path.trim();
            if (trimmed) {
              approvedStorage.add(trimmed);
            }
          }
        });
      })(),
    );
  }

  if (urlFallbacks.length) {
    approvalTasks.push(
      (async () => {
        const { data: photoRows, error: photoError } = await client
          .from('photos')
          .select('url, status')
          .in('url', urlFallbacks);
        if (photoError) {
          if (isTableMissingError(photoError, 'photos')) {
            logTableMissingWarning('photos', photoError);
            urlFallbacks.forEach((url) => approvedUrls.add(url));
            return;
          }
          throw photoError;
        }

        (photoRows ?? []).forEach((row) => {
          const status = (row as { status?: string }).status;
          const url = (row as { url?: string | null }).url;
          if (status === 'approved' && typeof url === 'string') {
            const trimmed = url.trim();
            if (trimmed) {
              approvedUrls.add(trimmed);
            }
          }
        });
      })(),
    );
  }

  if (approvalTasks.length) {
    await Promise.all(approvalTasks);
  }

  rows = rows.filter((row) => {
    const path = typeof row.storage_path === 'string' ? row.storage_path.trim() : '';
    if (path) {
      return approvedStorage.has(path);
    }
    const url = typeof row.photo_url === 'string' ? row.photo_url.trim() : '';
    if (url) {
      return approvedUrls.has(url);
    }
    return false;
  });

  if (!rows.length) {
    return rows;
  }

  const postIds = rows.map((row) => row.id);
  let likesRows: Array<{ post_id: string; from_user: string | null }> = [];

  const { data: likesData, error: likesError } = await client
    .from('likes')
    .select('post_id, from_user, kind')
    .in('post_id', postIds)
    .eq('kind', POST_LIKE_KIND);

  if (likesError) {
    if (isTableMissingError(likesError, 'likes')) {
      logTableMissingWarning('likes', likesError);
    } else if (isLikeKindColumnMissing(likesError)) {
      const { data: fallbackData, error: fallbackError } = await client
        .from('likes')
        .select('post_id, from_user')
        .in('post_id', postIds);
      if (fallbackError) {
        throw fallbackError;
      }
      likesRows = (fallbackData ?? []) as Array<{ post_id: string; from_user: string | null }>;
    } else {
      throw likesError;
    }
  } else {
    likesRows = (likesData ?? [])
      .filter((row) => row && typeof row.post_id === 'string')
      .map((row) => ({
        post_id: String(row.post_id),
        from_user: row.from_user ? String(row.from_user) : null,
      }));
  }

  if (likesRows.length) {
    const countMap = new Map<string, number>();
    const likedSet = new Set<string>();
    const viewerId = opts?.viewerId ?? null;

    likesRows.forEach((row) => {
      if (!row.post_id) return;
      countMap.set(row.post_id, (countMap.get(row.post_id) ?? 0) + 1);
      if (viewerId && row.from_user === viewerId) {
        likedSet.add(row.post_id);
      }
    });

    rows = rows.map((row) => ({
      ...row,
      like_count: countMap.get(row.id) ?? 0,
      liked_by_viewer: opts?.viewerId ? likedSet.has(row.id) : undefined,
    }));
  } else {
    rows = rows.map((row) => ({
      ...row,
      like_count: row.like_count ?? 0,
      liked_by_viewer: opts?.viewerId ? false : undefined,
    }));
  }

  return rows;
}
