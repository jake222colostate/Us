import type { FeedResponse, Post } from "@us/types";

import { normalizeError, ApiError } from "./client";
import { requireSupabaseClient } from "./supabase";
import { mapPostRow, mapProfileRow } from "./transformers";

const PAGE_SIZE = 12;

function decodeCursor(cursor?: string | null): number {
  if (!cursor) return 0;
  const numeric = Number.parseInt(cursor, 10);
  if (Number.isFinite(numeric)) return numeric;
  try {
    const decoder = typeof atob === "function" ? atob : undefined;
    if (decoder) {
      const decoded = decoder(cursor);
      const parsed = Number.parseInt(decoded, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return 0;
}

function encodeCursor(offset: number): string | null {
  if (!Number.isFinite(offset) || offset < 0) return null;
  return String(offset);
}

export async function fetchFeedPage({
  viewerId,
  cursor,
  radiusKm,
}: {
  viewerId: string;
  cursor?: string | null;
  radiusKm?: number | null;
}): Promise<FeedResponse> {
  const client = requireSupabaseClient();
  const offset = decodeCursor(cursor);

  try {
    const { data: profileRows, error: profileError } = await client
      .from("profiles")
      .select("*, user_photos(*)")
      .neq("user_id", viewerId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (profileError) {
      throw normalizeError(profileError, 400);
    }

    const candidates = (profileRows ?? []).map(mapProfileRow).filter((profile) => profile.photos.length > 0);
    const candidateIds = candidates.map((profile) => profile.user_id);

    if (candidateIds.length === 0) {
      return { posts: [], cursor: null };
    }

    const { data: likeRows, error: likesError } = await client
      .from("likes")
      .select("to_user")
      .eq("from_user", viewerId)
      .in("to_user", candidateIds);

    if (likesError) {
      throw normalizeError(likesError, 400);
    }

    const likedIds = new Set((likeRows ?? []).map((row: any) => row.to_user));

    const { data: matchRows, error: matchesError } = await client
      .from("matches")
      .select("user_a, user_b")
      .in("user_a", [viewerId, ...candidateIds])
      .in("user_b", [viewerId, ...candidateIds]);

    if (matchesError) {
      throw normalizeError(matchesError, 400);
    }

    const matchedIds = new Set<string>();
    for (const row of matchRows ?? []) {
      const other = row.user_a === viewerId ? row.user_b : row.user_a;
      if (other && other !== viewerId) {
        matchedIds.add(other);
      }
    }

    const filtered = candidates.filter((profile) => !likedIds.has(profile.user_id) && !matchedIds.has(profile.user_id));

    const posts: Post[] = filtered.map((profile) =>
      mapPostRow(
        {
          id: profile.user_id,
          user_id: profile.user_id,
          photo_url: profile.photos.find((photo) => photo.is_primary)?.url ?? profile.photos[0]?.url ?? "",
          caption: profile.bio,
          location: profile.location,
          created_at: profile.updated_at,
        },
        profile,
      ),
    );

    const nextCursor = filtered.length === PAGE_SIZE ? encodeCursor(offset + PAGE_SIZE) : null;

    return {
      posts,
      cursor: nextCursor,
    };
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function reactToPost({
  viewerId,
  post,
  action,
}: {
  viewerId: string;
  post: Post;
  action: "like" | "superlike" | "pass";
}): Promise<void> {
  if (action === "pass") return;
  const client = requireSupabaseClient();
  const toUser = post.user_id || post.profile?.user_id;
  if (!toUser) {
    throw new ApiError("Unable to determine the post owner", 400, post);
  }

  try {
    const { error: likeError } = await client
      .from("likes")
      .upsert(
        {
          from_user: viewerId,
          to_user: toUser,
          is_superlike: action === "superlike",
        },
        { onConflict: "from_user,to_user" },
      );
    if (likeError) {
      throw normalizeError(likeError, 400);
    }

    const { data: reciprocal, error: reciprocalError } = await client
      .from("likes")
      .select("id")
      .eq("from_user", toUser)
      .eq("to_user", viewerId)
      .maybeSingle();

    if (reciprocalError) {
      throw normalizeError(reciprocalError, 400);
    }

    if (reciprocal) {
      const participants = [viewerId, toUser].sort((a, b) => a.localeCompare(b));
      const [userA, userB] = participants;
      const { error: matchError } = await client
        .from("matches")
        .upsert(
          {
            user_a: userA,
            user_b: userB,
            matched_at: new Date().toISOString(),
          },
          { onConflict: "user_a,user_b" },
        );
      if (matchError) {
        throw normalizeError(matchError, 400);
      }
    }
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
