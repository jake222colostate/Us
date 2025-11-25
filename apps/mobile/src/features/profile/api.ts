import { supabase } from '../../api/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Profile, Post, Heart } from '@us/types';
import { loadDevManifest } from '../../lib/devAssets';
import { createSignedPhotoUrl } from '../../lib/photos';
import { listUserPosts } from '../../api/posts';
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
  const posts = await listUserPosts(userId, 50);
  const manifest = await loadDevManifest();

  if (!posts.length && manifest.length) {
    return manifest.map((uri, i) => ({
      id: `${userId}-fallback-${i}`,
      user_id: userId,
      photo_url: uri,
      caption: null,
      location: null,
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));
  }

  if (!manifest.length) {
    return posts;
  }

  let index = 0;
  return posts.map((post) => {
    if (post.photo_url) return post;
    const fallback = manifest[index % manifest.length];
    index += 1;
    return { ...post, photo_url: fallback };
  });
}

export async function fetchLikes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select(
        `
          id,
          post_id,
          from_user,
          to_user,
          kind,
          created_at,
          post:posts(id, user_id, photo_url, caption, created_at)
        `,
      )
      .eq('to_user', userId)
      .in('kind', ['like', 'superlike'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    let hearts = ((data as unknown as Heart[]) ?? []).map((heart) => ({ ...heart }));

    const fromUserIds = Array.from(
      new Set(hearts.map((h) => h.from_user).filter((id): id is string => Boolean(id))),
    );

    console.log('FETCH_LIKES fromUserIds', fromUserIds);
    if (fromUserIds.length) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, avatar_url, verification_status')
        .in('id', fromUserIds);

      if (profilesError) throw profilesError;

      const enrichedProfiles = await Promise.all(
        (profilesData ?? []).map(async (row) => {
          const storagePath = (row as any).avatar_url as string | null;
          const signed = await createSignedPhotoUrl(storagePath ?? null);
          return {
            ...(row as any),
            avatar_url: signed ?? storagePath ?? null,
          };
        }),
      );

      const profileById = new Map<string, any>(
        enrichedProfiles.map((p) => [String((p as any).id), p]),
      );
      console.log('FETCH_LIKES profile keys', Array.from(profileById.keys()));

      hearts = hearts.map((heart) => {
        const profile = profileById.get(heart.from_user);
        return profile ? { ...heart, profile } : heart;
      });
    }

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
