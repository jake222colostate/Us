import { getSupabaseClient } from './supabase';

type LikeOptions = {
  kind?: 'like' | 'superlike';
};

type LikeResult = {
  matchCreated: boolean;
  matchId?: string;
};

export async function likeUser(fromUserId: string, toUserId: string, options?: LikeOptions): Promise<LikeResult> {
  const client = getSupabaseClient();
  const { error: likeError } = await client
    .from('likes')
    .insert({ from_user: fromUserId, to_user: toUserId, kind: options?.kind ?? 'like' });

  if (likeError && !String(likeError.message).includes('duplicate key value')) {
    throw likeError;
  }

  const { data: reciprocal } = await client
    .from('likes')
    .select('id')
    .eq('from_user', toUserId)
    .eq('to_user', fromUserId)
    .maybeSingle();

  if (!reciprocal) {
    return { matchCreated: false };
  }

  const [userA, userB] = [fromUserId, toUserId].sort();
  const { data: matchRow, error: matchError } = await client
    .from('matches')
    .insert({ user_a: userA, user_b: userB })
    .select('*')
    .maybeSingle();

  if (matchError && !String(matchError.message).includes('matches_unique_pair')) {
    throw matchError;
  }

  return { matchCreated: true, matchId: (matchRow as { id: string } | null)?.id ?? undefined };
}
