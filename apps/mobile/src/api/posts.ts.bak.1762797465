import { getSupabaseClient } from '../api/supabase';

export type Post = {
  id: string;
  user_id: string;
  photo_url: string | null;
  caption?: string | null;
  created_at: string;
};

export async function createPost(args: { userId: string; photoUrl: string; caption?: string | null }): Promise<Post> {
  const client = getSupabaseClient();
  // Insert only columns we know exist; let created_at default server-side.
  const payload: Record<string, unknown> = {
    user_id: args.userId,
    photo_url: args.photoUrl,
  };
  if (typeof args.caption !== 'undefined') payload.caption = args.caption;

  const { data, error } = await client
    .from('posts')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as Post;
}

export async function listRecentPosts(limit = 50): Promise<Post[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('id,user_id,photo_url,caption,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function listUserPosts(userId: string, limit = 50): Promise<Post[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('posts')
    .select('id,user_id,photo_url,caption,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Post[];
}
