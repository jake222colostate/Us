import { getSupabaseClient } from './supabase';
import { createSignedPhotoUrl } from '../lib/photos';

export type LivePostRow = {
  id: string;
  user_id: string;
  photo_url: string;
  live_started_at: string;
  live_expires_at: string;
};

export type LiveNowProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type LiveNowItem = LivePostRow & {
  profile: LiveNowProfile | null;
};

export async function checkLiveGuard(userId: string): Promise<{ allowed: boolean; nextAllowedAt?: string }> {
  const client = getSupabaseClient();
  const { data, error } = await client.functions.invoke('live-guard', {
    body: { userId },
  });

  if (error) {
    throw error;
  }

  const payload = (data as { allowed?: boolean; nextAllowedAt?: string } | null) ?? {};
  return { allowed: Boolean(payload.allowed), nextAllowedAt: payload.nextAllowedAt };
}

export async function createLivePost({
  userId,
  photoUrl,
  liveExpiresAt,
}: {
  userId: string;
  photoUrl: string;
  liveExpiresAt: string;
}) {
  const client = getSupabaseClient();
  const { error } = await client.from('live_posts').insert({
    user_id: userId,
    photo_url: photoUrl,
    live_expires_at: liveExpiresAt,
  });
  if (error) {
    throw error;
  }
}

export async function deleteLivePost(livePostId: string) {
  const client = getSupabaseClient();
  const { error } = await client.from('live_posts').delete().eq('id', livePostId);
  if (error) {
    throw error;
  }
}

export async function fetchCurrentLivePost(userId: string): Promise<LivePostRow | null> {
  try {
    const client = getSupabaseClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await client
      .from('live_posts')
      .select('*')
      .eq('user_id', userId)
      .gt('live_expires_at', nowIso)
      .order('live_started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return (data as LivePostRow | null) ?? null;
  } catch (err) {
    console.warn('fetchCurrentLivePost failed', err);
    return null;
  }
}

export async function fetchLiveNow(): Promise<LiveNowItem[]> {
  try {
    const client = getSupabaseClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await client
      .from('live_posts')
      .select('*')
      .gt('live_expires_at', nowIso)
      .order('live_started_at', { ascending: false })
      .limit(25);
    if (error) throw error;

    const rows = (data ?? []) as LivePostRow[];
    if (!rows.length) {
      return [];
    }

    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    const { data: profileRows, error: profileError } = await client
      .from('profiles')
      .select('id, display_name, bio, avatar_url')
      .in('id', userIds);
    if (profileError) throw profileError;

    const profiles = await Promise.all(
      (profileRows ?? []).map(async (row) => ({
        id: row.id as string,
        name: (row.display_name as string | null) ?? null,
        bio: (row.bio as string | null) ?? null,
        avatarUrl: (await createSignedPhotoUrl((row.avatar_url as string | null) ?? null)) ?? null,
      })),
    );

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile] as const));
    return rows.map((row) => ({
      ...row,
      profile: profileMap.get(row.user_id) ?? null,
    }));
  } catch (err) {
    console.warn('fetchLiveNow failed', err);
    return [];
  }
}
