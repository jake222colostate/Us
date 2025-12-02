import { getSupabaseClient } from './supabase';
import { isTableMissingError, logTableMissingWarning } from './postgrestErrors';

type LikeOptions = {
  kind?: 'like' | 'superlike';
  source?: 'feed' | 'compare';
  compareLeftUrl?: string | null;
  compareRightUrl?: string | null;
  postId?: string | null;
};

type LikeResult = {
  matchCreated: boolean;
  matchId?: string;
};


// ⛔ enforce like/compare daily limits before inserting
async function checkUserLikeLimits(userId: string, source: 'feed' | 'compare'): Promise<boolean> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_user_daily_post_limits', { p_user_id: userId });
  if (error) { console.warn('[limit-check] failed', error); return true; }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return true;
  const remaining = source === 'compare' ? row.compare_posts_remaining : row.likes_remaining;
  if (remaining <= 0) {
    const msg = source === 'compare'
      ? 'You have used all your comparison posts for now. Try again later or upgrade your plan.'
      : 'You have used all your daily likes. Try again later or upgrade your plan.';
    throw new Error(msg);
  }
  return true;
}

export async function likeUser(
  fromUserId: string,
  toUserId: string,
  options?: LikeOptions,
): Promise<LikeResult> {
  const client = getSupabaseClient();

  const postId = options?.postId ?? null;

  // 🔒 Never send self-likes or invalid IDs to the backend.
  if (!fromUserId || !toUserId) {
    console.warn('⚠️ likeUser called with missing IDs', { fromUserId, toUserId, postId });
    return { matchCreated: false };
  }
  if (fromUserId === toUserId) {
    return { matchCreated: false };
  }

  console.log('📸 likeUser inserting', { fromUserId, toUserId, postId, source: options?.source });

  const { error: likeError } = await client
    .from('likes')
    .insert({
      from_user: fromUserId,
      to_user: toUserId,
      post_id: postId,
      kind: options?.kind ?? 'like',
      source: options?.source ?? 'feed',
      compare_left_url: options?.compareLeftUrl ?? null,
      compare_right_url: options?.compareRightUrl ?? null,
    });

  if (likeError) {
    if (isTableMissingError(likeError, 'likes')) {
      logTableMissingWarning('likes', likeError);
      return { matchCreated: false };
    }
    // Ignore duplicate-like errors; just treat as "already liked"
    if (!String(likeError.message).includes('duplicate key value')) {
      throw likeError;
    }
  }

  // Check for reciprocal like; use limit(1) to avoid PGRST116 when multiple rows exist.
  const { data: reciprocal, error: reciprocalError } = await client
    .from('likes')
    .select('id')
    .eq('from_user', toUserId)
    .eq('to_user', fromUserId)
    .limit(1)
    .maybeSingle();

  if (reciprocalError) {
    if (isTableMissingError(reciprocalError, 'likes')) {
      logTableMissingWarning('likes', reciprocalError);
      return { matchCreated: false };
    }
    throw reciprocalError;
  }

  if (!reciprocal) {
    return { matchCreated: false };
  }

  const [userA, userB] = [fromUserId, toUserId].sort();

  const { data: matchRow, error: matchError } = await client
    .from('matches')
    .insert({ user_a: userA, user_b: userB })
    .select('*')
    .limit(1)
    .maybeSingle();

  if (matchError) {
    if (isTableMissingError(matchError, 'matches')) {
      logTableMissingWarning('matches', matchError);
      return { matchCreated: false };
    }
    // Ignore unique-pair violations; match already exists.
    if (!String(matchError.message).includes('matches_pair_unique')) {
      throw matchError;
    }
  }

  return {
    matchCreated: true,
    matchId: (matchRow as { id: string } | null)?.id ?? undefined,
  };
}

export async function getPostLikeStatus(postId: string): Promise<boolean> {
  if (!postId) return false;
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_post_like_status', { p_post_id: postId });
  if (error) {
    console.warn('[getPostLikeStatus] failed', error);
    return false;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return !!row?.liked;
}
