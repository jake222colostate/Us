import { getSupabaseClient } from './supabase';

export type Post = {
  id: string;
  user_id: string;
  photo_url: string;
  created_at: string;
};

export async function createPost({ userId, photoUrl }: { userId: string; photoUrl: string }) {
  const client = getSupabaseClient();
  const { error } = await client.from('posts').insert({ user_id: userId, photo_url: photoUrl });
  if (error) throw error;
}

export async function listRecentPosts(limit = 50): Promise<Post[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('id,user_id,photo_url,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listUserPosts(userId: string, limit = 50): Promise<Post[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('id,user_id,photo_url,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
