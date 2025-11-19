import { getSupabaseClient } from './supabase';
import { isTableMissingError, logTableMissingWarning } from './postgrestErrors';
import { POST_PHOTO_BUCKET } from '../lib/photos';

export type FeedPost = {
  id: string;
  user_id: string;
  photo_url: string | null;
  storage_path: string | null;
  created_at: string;           // post created_at
  cursor_id: string;            // same as id (for tie-break)
  cursor_created_at: string;    // for keyset pagination
  owner_display_name: string | null;
  owner_bio: string | null;
  owner_gender: string | null;
  owner_avatar_url: string | null;
};

export type FeedPage = {
  rows: FeedPost[];
  nextCursor: { before_created_at: string; before_id: string } | null;
};

export async function fetchFeedPage(
  limit = 20,
  before?: { created_at: string; id: string },
): Promise<FeedPage> {
  const client = getSupabaseClient();
  const params: Record<string, any> = { _limit: limit };

  if (before) {
    params._before_created_at = before.created_at;
    params._before_id = before.id;
  }

  const { data, error } = await client.rpc('feed_posts_page', params);
  if (error) throw error;

  let rows = (data ?? []) as FeedPost[];

  if (rows.length) {
    const storagePaths = Array.from(
      new Set(
        rows
          .map((row) =>
            typeof row.storage_path === 'string' ? row.storage_path.trim() : '',
          )
          .filter((path) => path.length > 0),
      ),
    );

    const urlFallbacks = Array.from(
      new Set(
        rows
          .filter((row) => {
            const path =
              typeof row.storage_path === 'string'
                ? row.storage_path.trim()
                : '';
            const url =
              typeof row.photo_url === 'string' ? row.photo_url.trim() : '';
            return !path && url.length > 0;
          })
          .map((row) => (row.photo_url ?? '').trim()),
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
      const path =
        typeof row.storage_path === 'string' ? row.storage_path.trim() : '';
      if (path) {
        return approvedStorage.has(path);
      }
      const url =
        typeof row.photo_url === 'string' ? row.photo_url.trim() : '';
      if (url) {
        return approvedUrls.has(url);
      }
      return false;
    });
  }

  // Attach avatar_url from profiles and convert storage paths to public URLs
  if (rows.length) {
    const userIds = Array.from(
      new Set(
        rows
          .map((row) => row.user_id)
          .filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
      ),
    );

    if (userIds.length) {
      const { data: profiles, error: profilesError } = await client
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);

      if (!profilesError && profiles) {
        const avatarByUser = new Map<string, string>();
        const storage = client.storage.from(POST_PHOTO_BUCKET);

        (profiles as any[]).forEach((p) => {
          if (typeof p.id === 'string' && typeof p.avatar_url === 'string') {
            const trimmed = p.avatar_url.trim();
            if (trimmed) {
              const { data } = storage.getPublicUrl(trimmed);
              const publicUrl = data?.publicUrl ?? trimmed;
              avatarByUser.set(p.id, publicUrl);
            }
          }
        });

        rows = rows.map((row) => ({
          ...row,
          owner_avatar_url:
            avatarByUser.get(row.user_id) ?? row.owner_avatar_url ?? null,
        }));
      }
    }
  }

  const last = rows[rows.length - 1];

  return {
    rows,
    nextCursor: last
      ? { before_created_at: last.cursor_created_at, before_id: last.cursor_id }
      : null,
  };
}
