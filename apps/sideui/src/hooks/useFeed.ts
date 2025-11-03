import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "@us/types";

import { ENABLE_DEMO_DATA } from "../config";
import { demoFeed } from "../lib/demo-data";
import { ApiError, normalizeError } from "../api/client";
import { fetchFeedPage, reactToPost as reactToPostApi } from "../api/feed";
import { useAuth } from "../auth";
import { useProfile } from "./useProfile";
import { getSupabaseClient } from "../api/supabase";

interface UseFeedOptions {
  autoLoad?: boolean;
}

export function useFeed(options: UseFeedOptions = {}) {
  const { autoLoad = true } = options;
  const supabase = getSupabaseClient();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<ApiError | null>(null);
  const initialisedRef = useRef(false);

  const fetchPage = useCallback(
    async ({ nextCursor = null, append = false }: { nextCursor?: string | null; append?: boolean } = {}) => {
      if (!user?.id) {
        setPosts([]);
        setCursor(null);
        setError(null);
        initialisedRef.current = true;
        return;
      }

      if (!supabase) {
        if (!initialisedRef.current && ENABLE_DEMO_DATA) {
          setPosts(demoFeed.posts);
          setCursor(demoFeed.cursor ?? null);
          initialisedRef.current = true;
        }
        setError(new ApiError("Supabase client is not configured", 503, null));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetchFeedPage({
          viewerId: user.id,
          cursor: nextCursor,
          radiusKm: profile?.radius_km ?? null,
        });
        setPosts((prev) => (append ? [...prev, ...response.posts] : response.posts));
        setCursor(response.cursor ?? null);
        setError(null);
        initialisedRef.current = true;
      } catch (err) {
        const apiErr = normalizeError(err);
        if (!initialisedRef.current && ENABLE_DEMO_DATA) {
          setPosts(demoFeed.posts);
          setCursor(demoFeed.cursor ?? null);
          initialisedRef.current = true;
        }
        setError(apiErr);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, profile?.radius_km, supabase]
  );

  useEffect(() => {
    if (autoLoad) {
      void fetchPage({ nextCursor: null, append: false });
    }
  }, [autoLoad, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    await fetchPage({ nextCursor: cursor, append: true });
  }, [cursor, fetchPage]);

  const refetch = useCallback(async () => {
    await fetchPage({ nextCursor: null, append: false });
  }, [fetchPage]);

  const reactToPost = useCallback(
    async (postId: string, action: "like" | "superlike" | "pass") => {
      const target = posts.find((post) => post.id === postId);
      if (!target) return;

      if (!supabase) {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        if (!ENABLE_DEMO_DATA) {
          const unavailable = new ApiError("Supabase client is not configured", 503, null);
          setError(unavailable);
          throw unavailable;
        }
        return;
      }

      try {
        if (!user?.id) {
          throw new ApiError("You need to be signed in to like profiles", 401, null);
        }
        await reactToPostApi({ viewerId: user.id, post: target, action });
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      } catch (err) {
        const apiErr = normalizeError(err);
        setError(apiErr);
        if (!ENABLE_DEMO_DATA) {
          throw apiErr;
        }
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      }
    },
    [posts, supabase]
  );

  return useMemo(
    () => ({
      posts,
      loading,
      error,
      hasMore: cursor !== null,
      loadMore,
      refetch,
      reactToPost,
    }),
    [posts, loading, error, cursor, loadMore, refetch, reactToPost]
  );
}
