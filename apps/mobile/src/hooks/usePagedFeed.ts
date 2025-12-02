import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchFeedPage } from '../api/feed';
import type { Gender } from '@us/types';

export type FeedProfile = {
  id: string;
  postId: string | null;
  name: string | null;
  bio: string | null;
  caption: string | null;
  avatar: string | null;
  photo: string | null;
  gender: Gender | null;
};

type Cursor = { created_at: string; id: string } | null;

export function usePagedFeed(enabled: boolean) {
  const [items, setItems] = useState<FeedProfile[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef<Promise<any> | null>(null);

  const mapRows = useCallback((rows: any[]): FeedProfile[] => {
    return rows.map((r: any) => ({
      id: r.user_id,
      postId: r.id ?? null,
      name: r.owner_display_name ?? null,
      bio: r.owner_bio ?? null,
      caption: r.caption ?? null,
      avatar: (r.owner_avatar_url ?? r.avatar_url ?? null),
      photo: r.photo_url ?? null,
      gender: (r.owner_gender as Gender | null) ?? null,
    }));
  }, []);

  const loadFirst = useCallback(async () => {
    if (!enabled) return;
    if (pending.current) return;
    setLoading(true);
    try {
      const p = fetchFeedPage(20);
      pending.current = p;
      const { rows, nextCursor } = await p;
      setItems(mapRows(rows));
      setCursor(
        nextCursor
          ? { created_at: nextCursor.before_created_at, id: nextCursor.before_id }
          : null,
      );
    } finally {
      pending.current = null;
      setLoading(false);
    }
  }, [enabled, mapRows]);

  const loadMore = useCallback(async () => {
    if (!enabled) return;
    if (!cursor) return;
    if (pending.current) return;
    setLoadingMore(true);
    try {
      const p = fetchFeedPage(20, cursor);
      pending.current = p;
      const { rows, nextCursor } = await p;
      setItems(prev => [...prev, ...mapRows(rows)]);
      setCursor(
        nextCursor
          ? { created_at: nextCursor.before_created_at, id: nextCursor.before_id }
          : null,
      );
    } finally {
      pending.current = null;
      setLoadingMore(false);
    }
  }, [enabled, cursor, mapRows]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (pending.current) return;
    setRefreshing(true);
    try {
      const p = fetchFeedPage(20);
      pending.current = p;
      const { rows, nextCursor } = await p;
      setItems(mapRows(rows));
      setCursor(
        nextCursor
          ? { created_at: nextCursor.before_created_at, id: nextCursor.before_id }
          : null,
      );
    } finally {
      pending.current = null;
      setRefreshing(false);
    }
  }, [enabled, mapRows]);

  useEffect(() => {
    if (enabled) loadFirst();
  }, [enabled, loadFirst]);

  return {
    profiles: items,
    loading,
    loadingMore,
    refreshing,
    refresh,
    loadMore,
    hasMore: !!cursor,
  };
}