import { useCallback, useEffect, useMemo, useState } from "react";

import { ENABLE_DEMO_DATA } from "../config";
import { demoNotifications } from "../lib/demo-data";
import type { NotificationItem } from "../types";
import { ApiError, normalizeError } from "../api/client";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";
import { useAuth } from "../auth";
import { getSupabaseClient } from "../api/supabase";

export function useNotifications() {
  const supabase = getSupabaseClient();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        setNotifications(demoNotifications);
        setError(null);
      } else {
        setError(new ApiError("Supabase client is not configured", 503, null));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await fetchNotifications(user.id);
      setNotifications(items);
      setError(null);
    } catch (err) {
      const apiErr = normalizeError(err);
      if (ENABLE_DEMO_DATA && notifications.length === 0) {
        setNotifications(demoNotifications);
      }
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, notifications.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      if (!user?.id || !supabase) {
        if (!ENABLE_DEMO_DATA) {
          const unavailable = new ApiError("Supabase client is not configured", 503, null);
          setError(unavailable);
          throw unavailable;
        }
        return;
      }
      try {
        await markNotificationRead(user.id, id);
      } catch (err) {
        const apiErr = normalizeError(err);
        setError(apiErr);
        if (!ENABLE_DEMO_DATA) throw apiErr;
      }
    },
    [user?.id, supabase]
  );

  const markAllAsReadHandler = useCallback(async () => {
    const ids = notifications.filter((item) => !item.read).map((item) => item.id);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    if (!user?.id || !supabase) {
      if (!ENABLE_DEMO_DATA) {
        const unavailable = new ApiError("Supabase client is not configured", 503, null);
        setError(unavailable);
        throw unavailable;
      }
      return;
    }
    try {
      await markAllNotificationsRead(user.id);
    } catch (err) {
      const apiErr = normalizeError(err);
      setError(apiErr);
      if (!ENABLE_DEMO_DATA) throw apiErr;
      // Revert if necessary for live environment, but keep marked in demo mode
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read: ids.includes(item.id) ? false : item.read }))
      );
    }
  }, [notifications, user?.id, supabase]);

  return useMemo(
    () => ({ notifications, loading, error, refetch: load, markAsRead, markAllAsRead: markAllAsReadHandler }),
    [notifications, loading, error, load, markAsRead, markAllAsReadHandler]
  );
}
