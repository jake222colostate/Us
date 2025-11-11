import { getSupabaseClient } from './supabase';

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
};

export type FeedPage = {
  rows: FeedPost[];
  nextCursor: { before_created_at: string; before_id: string } | null;
};

export async function fetchFeedPage(limit = 20, before?: { created_at: string; id: string }): Promise<FeedPage> {
  const client = getSupabaseClient();
  const params: Record<string, any> = { _limit: limit };
  if (before) {
    params._before_created_at = before.created_at;
    params._before_id = before.id;
  }
  const { data, error } = await client.rpc('feed_posts_page', params);
  if (error) throw error;

  const rows = (data ?? []) as FeedPost[];
  const last = rows[rows.length - 1];

  return {
    rows,
    nextCursor: last
      ? { before_created_at: last.cursor_created_at, before_id: last.cursor_id }
      : null,
  };
}
