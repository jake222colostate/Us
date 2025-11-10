import { getSupabaseClient } from '../../api/supabase';

export type FeedPost = {
  id: string;
  user_id: string;
  photo_url: string;     // canonical
  image_url?: string;    // alias for older components
  created_at: string;
  profile?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
};

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
  const { data, error } = await client
    .from('posts')
    .select(`
      id,
      user_id,
      photo_url,
      image_url:photo_url,
      created_at,
      profile:profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const rows = (data ?? []) as FeedPost[];
  // debug so we can see this hit Metro logs
  console.log('🟢 fetchFeed: rows', rows.length, 'offset', offset, 'limit', limit, rows[0]);
  return rows;
}
