import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import { mapProfileRow } from "./transformers";
import type { ChatMessage, ChatThread } from "../types";

function mapMessage(row: any, currentUserId: string): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    body: row.body ?? "",
    sentAt: typeof row.sent_at === "string" ? row.sent_at : new Date(row.sent_at).toISOString(),
    seenAt: row.seen_at ? (typeof row.seen_at === "string" ? row.seen_at : new Date(row.seen_at).toISOString()) : null,
    isMine: row.sender_id === currentUserId,
  };
}

export async function fetchThreads(currentUserId: string): Promise<ChatThread[]> {
  const client = requireSupabaseClient();
  try {
    const { data: threadRows, error } = await client
      .from("chat_threads")
      .select("*")
      .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      throw normalizeError(error, 400);
    }

    const threads = Array.isArray(threadRows) ? threadRows : [];
    if (threads.length === 0) return [];

    const partnerIds = Array.from(
      new Set(
        threads.map((thread: any) => (thread.user_a === currentUserId ? thread.user_b : thread.user_a))
      )
    );

    const { data: profileRows, error: profileError } = await client.from("profiles").select("*").in("user_id", partnerIds);
    if (profileError) {
      throw normalizeError(profileError, 400);
    }

    const profileMap = new Map(
      (profileRows ?? []).map((row: any) => {
        const profile = mapProfileRow(row);
        return [profile.user_id, profile] as const;
      })
    );

    const threadIds = threads.map((thread: any) => thread.id);
    const { data: messageRows, error: messagesError } = await client
      .from("chat_messages")
      .select("*")
      .in("thread_id", threadIds)
      .order("sent_at", { ascending: false });
    if (messagesError) {
      throw normalizeError(messagesError, 400);
    }

    const groupedMessages = new Map<string, any[]>();
    (messageRows ?? []).forEach((row: any) => {
      const list = groupedMessages.get(row.thread_id) ?? [];
      list.push(row);
      groupedMessages.set(row.thread_id, list);
    });

    return threads
      .map((thread: any) => {
        const partnerId = thread.user_a === currentUserId ? thread.user_b : thread.user_a;
        const partner = profileMap.get(partnerId);
        if (!partner) return null;
        const messages = groupedMessages.get(thread.id) ?? [];
        const lastMessageRow = messages[0] ?? null;
        const unreadCount = messages.filter((row) => row.sender_id !== currentUserId && !row.seen_at).length;
        return {
          id: thread.id,
          partner,
          lastMessage: lastMessageRow ? mapMessage(lastMessageRow, currentUserId) : null,
          unreadCount,
          createdAt: typeof thread.created_at === "string" ? thread.created_at : new Date(thread.created_at).toISOString(),
          matchId: thread.match_id ?? null,
        } satisfies ChatThread;
      })
      .filter((thread): thread is ChatThread => Boolean(thread));
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function fetchMessages(threadId: string, currentUserId: string): Promise<ChatMessage[]> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("sent_at", { ascending: true });
    if (error) {
      throw normalizeError(error, 400);
    }
    const rows = data ?? [];
    const messages = rows.map((row: any) => mapMessage(row, currentUserId));
    const unreadIds = rows
      .filter((row: any) => row.sender_id !== currentUserId && !row.seen_at)
      .map((row: any) => row.id);
    if (unreadIds.length > 0) {
      await client.from("chat_messages").update({ seen_at: new Date().toISOString() }).in("id", unreadIds);
    }
    return messages;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function sendMessage({
  threadId,
  currentUserId,
  body,
}: {
  threadId: string;
  currentUserId: string;
  body: string;
}): Promise<ChatMessage> {
  const client = requireSupabaseClient();
  try {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new ApiError("Message body is required", 400, null);
    }
    const { data, error } = await client
      .from("chat_messages")
      .insert({ thread_id: threadId, sender_id: currentUserId, body: trimmed })
      .select("*")
      .single();
    if (error) {
      throw normalizeError(error, 400);
    }
    await client.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    return mapMessage(data, currentUserId);
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
