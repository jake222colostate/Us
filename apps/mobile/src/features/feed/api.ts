import { supabase } from '../../api/supabase';
import type { Post, Profile } from '@us/types';
import { loadDevManifest } from '../../lib/devAssets';

export type HeartSelfieUpload = {
  uri: string;
  mimeType: string;
  fileName?: string;
};

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

const HEART_SELFIE_BUCKET = 'heart-selfies';

const getExtensionFromMime = (mimeType: string) => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic') return 'heic';
  if (mimeType === 'image/heif') return 'heif';
  return 'jpg';
};

export async function uploadHeartSelfie(userId: string, selfie: HeartSelfieUpload) {
  const extension = getExtensionFromMime(selfie.mimeType);
  const sanitized = selfie.fileName?.replace(/\s+/g, '_');
  const nameWithExt = sanitized
    ? sanitized.includes('.')
      ? sanitized
      : `${sanitized}.${extension}`
    : `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `${userId}/${nameWithExt}`;
  const response = await fetch(selfie.uri);
  const blob = await response.blob();
  const { data, error } = await supabase.storage
    .from(HEART_SELFIE_BUCKET)
    .upload(path, blob, { contentType: selfie.mimeType, upsert: false });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from(HEART_SELFIE_BUCKET).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

export async function sendFreeHeart(postId: string, toUser: string, options?: { message?: string; selfieUrl?: string }) {
  const payload: Record<string, unknown> = { _post: postId, _to: toUser };
  if (options?.message !== undefined) {
    payload._message = options.message;
  }
  if (options?.selfieUrl !== undefined) {
    payload._selfie_url = options.selfieUrl;
  }
  const { data, error } = await supabase.rpc('send_free_heart', payload);
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
  selfieUrl,
}: {
  postId: string;
  toUser: string;
  purchaseId?: string;
  message?: string;
  selfieUrl?: string;
}) {
  const { error } = await supabase.functions.invoke('on-big-heart', {
    body: {
      post_id: postId,
      to_user: toUser,
      purchase_id: purchaseId ?? null,
      message: message ?? null,
      selfie_url: selfieUrl ?? null,
    },
  });
  if (error) throw error;
}
