import { supabase } from '../../api/supabase';
import type { Post, Profile } from '@us/types';
import { loadDevManifest } from '../../lib/devAssets';

export async function fetchFeed({
  limit,
  offset,
  viewerId,
  radiusKm,
}: {
  limit: number;
  offset: number;
  viewerId: string;
  radiusKm: number;
}): Promise<Post[]> {
  const { data, error } = await supabase.rpc('get_feed_interleaved', {
    _viewer: viewerId,
    _limit: limit,
    _offset: offset,
    _radius_km: radiusKm,
  });

  if (error) {
    throw error;
  }

  const posts = (data as Post[]) ?? [];
  const userIds = Array.from(new Set(posts.map((post) => post.user_id)));
  const { data: profiles } =
    userIds.length > 0 ? await supabase.from('profiles').select('*').in('user_id', userIds) : { data: [] as Profile[] };

  const manifest = await loadDevManifest();
  let manifestIndex = 0;
  const nextFallback = () => {
    if (!manifest.length) return null;
    const uri = manifest[manifestIndex % manifest.length];
    manifestIndex += 1;
    return uri;
  };

  const profileMap = new Map(
    (profiles ?? []).map((profile) => {
      if ((!profile.photo_urls || profile.photo_urls.length === 0) && manifest.length) {
        const fallback = nextFallback();
        return [profile.user_id, { ...profile, photo_urls: fallback ? [fallback] : [] } as Profile];
      }
      return [profile.user_id, profile] as const;
    }),
  );

  return posts.map((post) => {
    const baseProfile = profileMap.get(post.user_id);
    if (post.photo_url) {
      return { ...post, profile: baseProfile };
    }
    const fallback = nextFallback();
    return fallback ? { ...post, photo_url: fallback, profile: baseProfile } : { ...post, profile: baseProfile };
  });
}

export async function sendFreeHeart(postId: string, toUser: string) {
  const { data, error } = await supabase.rpc('send_free_heart', { _post: postId, _to: toUser });
  if (error) {
    if (String(error.message).includes('FREE_HEART_LIMIT_REACHED')) {
      throw new Error('FREE_HEART_LIMIT_REACHED');
    }
    throw error;
  }
  return data as string;
}

export async function sendBigHeart({
  postId,
  toUser,
  purchaseId,
  message,
}: {
  postId: string;
  toUser: string;
  purchaseId?: string;
  message?: string;
}) {
  const { error } = await supabase.functions.invoke('on-big-heart', {
    body: {
      post_id: postId,
      to_user: toUser,
      purchase_id: purchaseId ?? null,
      message: message ?? null,
    },
  });
  if (error) throw error;
}
