import { supabase } from '../../api/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Profile, Post, Heart } from '@us/types';
import { loadDevManifest } from '../../lib/devAssets';
import type { PhotoRow } from '../../lib/photos';

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
  if (error) throw error;
  const profile = data as Profile;
  const manifest = await loadDevManifest();
  if ((!profile.photo_urls || profile.photo_urls.length === 0) && manifest.length) {
    return { ...profile, photo_urls: [manifest[0]] };
  }
  return profile;
}

export async function fetchProfilePosts(userId: string) {
  const { data, error } = await supabase
    .from('photos')
    .select('id, user_id, url, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = ((data ?? []) as PhotoRow[]).filter((row) => row.status === 'approved');
  const manifest = await loadDevManifest();
  let index = 0;

  const mapped: Post[] = rows.map((row) => {
    const photoUrl = row.url ?? (manifest.length ? manifest[index++ % manifest.length] : null);
    return {
      id: row.id,
      user_id: row.user_id,
      photo_url: photoUrl ?? '',
      caption: null,
      location: null,
      created_at: row.created_at ?? new Date().toISOString(),
    };
  });

  if (!mapped.length && manifest.length) {
    return manifest.map((uri, i) => ({
      id: `${userId}-fallback-${i}`,
      user_id: userId,
      photo_url: uri,
      caption: null,
      location: null,
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));
  }

  return mapped;
}

export async function fetchLikes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('hearts')
      .select(
        `
          id,
          post_id,
          from_user,
          to_user,
          kind,
          paid,
          message,
          created_at,
          post:posts(id, user_id, photo_url, caption, created_at),
          profile:profiles!hearts_from_user_fkey(user_id, display_name, photo_urls, avatar_url)
        `,
      )
      .eq('to_user', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const hearts = ((data as unknown as Heart[]) ?? []).map((heart) => ({ ...heart }));
    const manifest = await loadDevManifest();
    let manifestIndex = 0;
    const nextFallback = () => {
      if (!manifest.length) return null;
      const uri = manifest[manifestIndex % manifest.length];
      manifestIndex += 1;
      return uri;
    };

    return hearts.map((heart) => {
      const profileFallback =
        heart.profile && (!heart.profile.photo_urls || heart.profile.photo_urls.length === 0)
          ? nextFallback()
          : null;
      const profile = heart.profile
        ? {
            ...heart.profile,
            photo_urls: profileFallback ? [profileFallback] : heart.profile.photo_urls,
          }
        : undefined;

      const postFallback = heart.post && !heart.post.photo_url ? nextFallback() : null;
      const post = heart.post
        ? {
            ...heart.post,
            photo_url: heart.post.photo_url || postFallback || undefined,
          }
        : undefined;
      return { ...heart, profile, post };
    });
  } catch (err) {
    const pgError = err as PostgrestError | null;
    if (pgError?.code === 'PGRST205') {
      return [];
    }
    throw err;
  }
}

export async function blockUser({ blocker, blocked }: { blocker: string; blocked: string }) {
  const { error } = await supabase.from('blocks').insert({ blocker, blocked });
  if (error) throw error;
}

export async function reportUser({ reporter, reportedUser, reason }: { reporter: string; reportedUser: string; reason: string }) {
  const { error } = await supabase.from('reports').insert({ reporter, reported_user: reportedUser, reason });
  if (error) throw error;
}
