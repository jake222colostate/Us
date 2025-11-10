import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { isTableMissingError, logTableMissingWarning } from './postgrestErrors';

export const POST_LIKE_KIND = 'post';
const LIKE_KIND = POST_LIKE_KIND;

type LikeArgs = {
  postId: string;
  fromUserId: string;
  toUserId: string;
};

type UnlikeArgs = {
  postId: string;
  fromUserId: string;
};

export function isLikeKindColumnMissing(error: PostgrestError | null | undefined) {
  if (!error) return false;
  if (error.code === 'PGRST204') return true;
  if (error.code === '42703' && error.message?.toLowerCase().includes('kind')) {
    return true;
  }
  return false;
}

export async function likePost({ postId, fromUserId, toUserId }: LikeArgs): Promise<void> {
  const client = getSupabaseClient();
  const payload = {
    post_id: postId,
    from_user: fromUserId,
    to_user: toUserId,
    kind: LIKE_KIND,
  };

  const { error } = await client
    .from('likes')
    .upsert(payload, { onConflict: 'from_user,post_id,kind' })
    .select('id')
    .maybeSingle();

  if (!error) {
    return;
  }

  if (isTableMissingError(error, 'likes')) {
    logTableMissingWarning('likes', error);
    return;
  }

  if (isLikeKindColumnMissing(error)) {
    const fallback = { ...payload };
    delete (fallback as { kind?: string }).kind;
    const { error: retryError } = await client
      .from('likes')
      .upsert(fallback, { onConflict: 'from_user,post_id' })
      .select('id')
      .maybeSingle();
    if (retryError) {
      throw retryError;
    }
    return;
  }

  if (String(error.message ?? '').includes('duplicate key value')) {
    return;
  }

  throw error;
}

export async function unlikePost({ postId, fromUserId }: UnlikeArgs): Promise<void> {
  const client = getSupabaseClient();
  const match = {
    post_id: postId,
    from_user: fromUserId,
    kind: LIKE_KIND,
  };

  const { error } = await client.from('likes').delete().match(match);

  if (!error || error.code === 'PGRST116') {
    return;
  }

  if (isTableMissingError(error, 'likes')) {
    logTableMissingWarning('likes', error);
    return;
  }

  if (isLikeKindColumnMissing(error)) {
    const fallbackMatch = { ...match };
    delete (fallbackMatch as { kind?: string }).kind;
    const { error: retryError } = await client.from('likes').delete().match(fallbackMatch);
    if (retryError && retryError.code !== 'PGRST116') {
      throw retryError;
    }
    return;
  }

  throw error;
}
