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
    const { data, error } = await client.rpc("get_feed_interleaved", {
      _viewer: viewerId,
      _limit: PAGE_SIZE,
      _offset: offset,
      _radius_km: radiusKm ?? null,
    });

    if (error) {
      throw normalizeError(error, 400);
    }

    const posts = Array.isArray(data) ? data : [];
    const userIds = Array.from(
      new Set(
        posts
          .map((post: any) => post.user_id)
          .filter((value: unknown): value is string => typeof value === "string")
      )
    );

    let profileMap = new Map<string, ReturnType<typeof mapProfileRow>>();
    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await client.from("profiles").select("*").in("user_id", userIds);
      if (profileError) {
        throw normalizeError(profileError, 400);
      }
      profileMap = new Map(
        (profileRows ?? []).map((row: any) => {
          const profile = mapProfileRow(row);
          return [profile.user_id, profile] as const;
        })
      );
    }

    const normalizedPosts: Post[] = posts.map((post: any) => {
      const profile = profileMap.get(post.user_id ?? "");
      return mapPostRow(post, profile ?? undefined);
    });

    const nextCursor = normalizedPosts.length === PAGE_SIZE ? encodeCursor(offset + PAGE_SIZE) : null;

    return {
      posts: normalizedPosts,
      cursor: nextCursor,
    };
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function reactToPost({
  post,
  action,
  message,
  selfieUrl,
}: {
  post: Post;
  action: "like" | "superlike" | "pass";
  message?: string | null;
  selfieUrl?: string | null;
}): Promise<void> {
  if (action === "pass") return;
  const client = requireSupabaseClient();
  const toUser = post.user_id || post.profile?.user_id;
  if (!toUser) {
    throw new ApiError("Unable to determine the post owner", 400, post);
  }

  try {
    if (action === "like") {
      const { error } = await client.rpc("send_free_heart", {
        _post: post.id,
        _to: toUser,
        _message: message ?? null,
        _selfie_url: selfieUrl ?? null,
      });
      if (error) {
        throw normalizeError(error, 400);
      }
      return;
    }

    const { error } = await client.functions.invoke("on-big-heart", {
      body: {
        post_id: post.id,
        to_user: toUser,
        message: message ?? null,
        selfie_url: selfieUrl ?? null,
      },
    });
    if (error) {
      throw normalizeError(error, 400);
    }
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
