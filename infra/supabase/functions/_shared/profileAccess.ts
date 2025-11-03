import { type PostgrestSingleResponse } from 'https://esm.sh/@supabase/supabase-js@2.39.2';

import type { AuthContext } from './auth.ts';

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  birthdate: string | null;
  gender: string | null;
  looking_for: string | null;
  photo_urls: string[] | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  verification_status?: string | null;
  visibility_score?: number | null;
};

type UnlockRow = {
  viewer_id: string;
  target_user_id: string;
  expires_at: string | null;
  source: string;
  created_at: string;
};

type AccessReason = 'self' | 'match' | 'purchase' | 'admin' | 'none';

function sanitiseProfile(row: ProfileRow, mode: 'full' | 'limited') {
  const photos = Array.isArray(row.photo_urls) ? row.photo_urls.filter((url) => typeof url === 'string') : [];
  const limitedPhotos = mode === 'limited' ? photos.slice(0, 1) : photos;
  return {
    user_id: row.user_id,
    username: row.username,
    display_name: row.display_name,
    bio: mode === 'limited' ? row.bio?.slice(0, 140) ?? null : row.bio,
    birthdate: row.birthdate,
    gender: row.gender,
    looking_for: row.looking_for,
    photo_urls: limitedPhotos,
    preferences: mode === 'limited' ? null : row.preferences,
    created_at: row.created_at,
    updated_at: row.updated_at,
    verification_status: row.verification_status ?? 'none',
    visibility_score: typeof row.visibility_score === 'number' ? row.visibility_score : 1,
  };
}

async function fetchProfileRow(service: AuthContext['service'], targetUserId: string) {
  const { data, error }: PostgrestSingleResponse<ProfileRow> = await service
    .from('profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (error) {
    throw new Response(error.message ?? 'Failed to load profile', { status: 400 });
  }
  return data ?? null;
}

async function determineAccess(
  service: AuthContext['service'],
  viewerId: string,
  targetId: string,
): Promise<{ reason: AccessReason; unlock: UnlockRow | null }> {
  if (viewerId === targetId) {
    return { reason: 'self', unlock: null };
  }

  const { data: match } = await service
    .from('matches')
    .select('id')
    .or(`and(user_a.eq.${viewerId},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${viewerId})`)
    .limit(1)
    .maybeSingle();

  if (match) {
    return { reason: 'match', unlock: null };
  }

  const { data: unlockRow } = await service
    .from('profile_unlocks')
    .select('*')
    .eq('viewer_id', viewerId)
    .eq('target_user_id', targetId)
    .is('expires_at', null)
    .limit(1)
    .maybeSingle();

  if (unlockRow) {
    return { reason: 'purchase', unlock: unlockRow as UnlockRow };
  }

  const { data: unlockWithExpiry } = await service
    .from('profile_unlocks')
    .select('*')
    .eq('viewer_id', viewerId)
    .eq('target_user_id', targetId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (unlockWithExpiry) {
    return { reason: 'purchase', unlock: unlockWithExpiry as UnlockRow };
  }

  return { reason: 'none', unlock: null };
}

export async function buildProfileAccess(
  ctx: AuthContext,
  targetUserId: string,
): Promise<Response> {
  const profileRow = await fetchProfileRow(ctx.service, targetUserId);
  if (!profileRow) {
    return new Response(
      JSON.stringify({
        profile: null,
        limited_profile: null,
        can_view_full_profile: false,
        unlock_reason: 'none',
        access_expires_at: null,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { reason, unlock } = await determineAccess(ctx.service, ctx.user.id, targetUserId);
  const canView = reason !== 'none';
  const fullProfile = sanitiseProfile(profileRow, 'full');
  const limitedProfile = sanitiseProfile(profileRow, 'limited');

  const payload = {
    profile: canView ? fullProfile : limitedProfile,
    limited_profile: limitedProfile,
    can_view_full_profile: canView,
    unlock_reason: reason === 'admin' ? 'purchase' : reason,
    access_expires_at: unlock?.expires_at ?? null,
  };

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function assertProfileAccessible(ctx: AuthContext, targetUserId: string) {
  const { reason } = await determineAccess(ctx.service, ctx.user.id, targetUserId);
  return reason !== 'none';
}

export async function grantProfileUnlock(
  ctx: AuthContext,
  targetUserId: string,
  source: string,
  expiresAt: string | null = null,
) {
  const { error } = await ctx.service
    .from('profile_unlocks')
    .upsert({
      viewer_id: ctx.user.id,
      target_user_id: targetUserId,
      source,
      expires_at: expiresAt,
    }, { onConflict: 'viewer_id,target_user_id' });
  if (error) {
    throw new Response(error.message ?? 'Failed to grant unlock', { status: 400 });
  }
}
