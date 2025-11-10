import { getSupabaseClient } from '../api/supabase';

export type LivePost = {
  id: string;
  user_id: string;
  photo_url: string | null;
  caption: string | null;
  created_at: string;
  live_expires_at: string | null;
};

export async function fetchCurrentLivePost(userId: string): Promise<LivePost | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('live_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch {
    // If table/edge function isn't ready, don't crash the UI
    return null;
  }
}

export async function fetchLiveNow(): Promise<LivePost[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('live_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw error;
    return data ?? [];
  } catch {
    // Soft-fail: show no live items instead of throwing
    return [];
  }
}
