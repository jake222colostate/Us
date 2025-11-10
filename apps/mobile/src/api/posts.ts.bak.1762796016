import { getSupabaseClient } from './supabase';
import type { Post } from '@us/types';

export type CreatePostArgs = {
  userId: string;
  photoUrl: string;
  caption?: string | null;
};

export async function createPost({ userId, photoUrl, caption }: CreatePostArgs): Promise<Post> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('live_posts')
    .insert({ user_id: userId, photo_url: photoUrl, caption: caption ?? null })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Unable to create post');
  }

  return data as Post;
}
