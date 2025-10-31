import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import type { NotificationItem } from "../types";

function mapNotification(row: any): NotificationItem {
  return {
    id: row.id,
    kind: (row.kind ?? "system") as NotificationItem["kind"],
    title: row.title ?? "Notification",
    body: row.body ?? "",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
    read: Boolean(row.read),
    actionUrl: row.action_url ?? null,
  };
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      throw normalizeError(error, 400);
    }
    return (data ?? []).map(mapNotification);
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const client = requireSupabaseClient();
  try {
    const { error } = await client
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", notificationId);
    if (error) {
      throw normalizeError(error, 400);
    }
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const client = requireSupabaseClient();
  try {
    const { error } = await client
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) {
      throw normalizeError(error, 400);
    }
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
