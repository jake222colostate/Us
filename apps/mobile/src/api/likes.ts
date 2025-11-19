import { getSupabaseClient } from './supabase';
import { isTableMissingError, logTableMissingWarning } from './postgrestErrors';

type LikeOptions = {
  kind?: 'like' | 'superlike';
};

type LikeResult = {
  matchCreated: boolean;
  matchId?: string;
};

export async function likeUser(
  fromUserId: string,
  toUserId: string,
  options?: LikeOptions,
): Promise<LikeResult> {
  const client = getSupabaseClient();

  // 🔒 Never send self-likes to the backend (UI can still toggle the heart).
  if (fromUserId === toUserId) {
    return { matchCreated: false };
  }

  const { error: likeError } = await client
    .from('likes')
    .insert({
      from_user: fromUserId,
      to_user: toUserId,
      kind: options?.kind ?? 'like',
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
    if (!String(matchError.message).includes('matches_unique_pair')) {
      throw matchError;
    }
  }

  return {
    matchCreated: true,
    matchId: (matchRow as { id: string } | null)?.id ?? undefined,
  };
}
