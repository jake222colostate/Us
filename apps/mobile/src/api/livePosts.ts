import { getSupabaseClient } from './supabase';

type CreateLivePostArgs = { userId: string; photoUrl: string };

export async function checkLiveGuard(_userId: string) {
  return { ok: true as const };
}

export async function createLivePost({ userId, photoUrl }: CreateLivePostArgs) {
  const client = getSupabaseClient();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('live_posts')
    .insert({ user_id: userId, photo_url: photoUrl, live_expires_at: expiresAt })
    .select()
    .single();

  if (error) throw error;
  return data;
}
