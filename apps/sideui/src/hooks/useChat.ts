import { useCallback, useEffect, useMemo, useState } from "react";

import { ENABLE_DEMO_DATA } from "../config";
import { demoChatMessages, demoChatThreads } from "../lib/demo-data";
import type { ChatMessage, ChatThread } from "../types";
import { ApiError, normalizeError } from "../api/client";
import { fetchMessages as fetchMessagesApi, fetchThreads as fetchThreadsApi, sendMessage as sendMessageApi } from "../api/chat";
import { getSupabaseClient } from "../api/supabase";

export function useChat(currentUserId?: string, initialThreadId?: string | null) {
  const supabase = getSupabaseClient();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const loadThreads = useCallback(async () => {
    if (!currentUserId) {
      setThreads([]);
      setActiveThreadId(null);
      setLoadingThreads(false);
      return;
    }

    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        const fallback = demoChatThreads.map((thread) => ({
          ...thread,
          lastMessage: thread.lastMessage
            ? { ...thread.lastMessage, isMine: thread.lastMessage.senderId === currentUserId }
            : null,
        }));
        setThreads(fallback);
        if (!activeThreadId && fallback.length > 0) {
          setActiveThreadId(fallback[0].id);
        }
        setError(null);
      } else {
        setError(new ApiError("Supabase client is not configured", 503, null));
      }
      setLoadingThreads(false);
      return;
    }

    setLoadingThreads(true);
    try {
      const data = await fetchThreadsApi(currentUserId);
      setThreads(data);
      if (!activeThreadId && data.length > 0) {
        setActiveThreadId(data[0].id);
      }
      setError(null);
    } catch (err) {
      const apiErr = normalizeError(err);
      if (ENABLE_DEMO_DATA) {
        const fallback = demoChatThreads.map((thread) => ({
          ...thread,
          lastMessage: thread.lastMessage
            ? { ...thread.lastMessage, isMine: thread.lastMessage.senderId === currentUserId }
            : null,
        }));
        setThreads((prev) => (prev.length === 0 ? fallback : prev));
        if (!activeThreadId && fallback.length > 0) {
          setActiveThreadId(fallback[0].id);
        }
      }
      setError(apiErr);
    } finally {
      setLoadingThreads(false);
    }
  }, [currentUserId, supabase, activeThreadId]);

  const loadMessages = useCallback(
    async (threadId: string) => {
      if (!currentUserId) {
        setMessages([]);
        return;
      }

      if (!supabase) {
        if (ENABLE_DEMO_DATA) {
          const fallback = (demoChatMessages[threadId] ?? []).map((msg) => ({
            ...msg,
            isMine: msg.senderId === currentUserId,
          }));
          setMessages(fallback);
        } else {
          setError(new ApiError("Supabase client is not configured", 503, null));
        }
        return;
      }

      setLoadingMessages(true);
      try {
        const data = await fetchMessagesApi(threadId, currentUserId);
        setMessages(data);
        setError(null);
      } catch (err) {
        const apiErr = normalizeError(err);
        if (ENABLE_DEMO_DATA) {
          const fallback = (demoChatMessages[threadId] ?? []).map((msg) => ({
            ...msg,
            isMine: msg.senderId === currentUserId,
          }));
          setMessages(fallback);
        }
        setError(apiErr);
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentUserId, supabase]
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (activeThreadId) {
      void loadMessages(activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId, loadMessages]);

  const selectThread = useCallback((threadId: string | null) => {
    setActiveThreadId(threadId);
  }, []);

  const sendMessage = useCallback(
    async (threadId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return null;
      if (!currentUserId) {
        throw new ApiError("Not authenticated", 401, null);
      }
      if (!supabase) {
        if (ENABLE_DEMO_DATA) {
          const fallback: ChatMessage = {
            id: `local-${Date.now()}`,
            threadId,
            senderId: currentUserId,
            body: trimmed,
            sentAt: new Date().toISOString(),
            seenAt: null,
            isMine: true,
          };
          setMessages((prev) => [...prev, fallback]);
          return fallback;
        }
        const unavailable = new ApiError("Supabase client is not configured", 503, null);
        setError(unavailable);
        throw unavailable;
      }
      try {
        const message = await sendMessageApi({ threadId, currentUserId, body: trimmed });
        setMessages((prev) => [...prev, message]);
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId ? { ...thread, lastMessage: message, unreadCount: 0 } : thread
          )
        );
        return message;
      } catch (err) {
        const apiErr = normalizeError(err);
        setError(apiErr);
        if (!ENABLE_DEMO_DATA) {
          throw apiErr;
        }
        const fallback: ChatMessage = {
          id: `local-${Date.now()}`,
          threadId,
          senderId: currentUserId,
          body: trimmed,
          sentAt: new Date().toISOString(),
          seenAt: null,
          isMine: true,
        };
        setMessages((prev) => [...prev, fallback]);
        return fallback;
      }
    },
    [currentUserId, supabase]
  );

  return useMemo(
    () => ({
      threads,
      messages,
      activeThreadId,
      selectThread,
      sendMessage,
      loadingThreads,
      loadingMessages,
      error,
      refetchThreads: loadThreads,
      refetchMessages: () => (activeThreadId ? loadMessages(activeThreadId) : Promise.resolve()),
    }),
    [
      threads,
      messages,
      activeThreadId,
      selectThread,
      sendMessage,
      loadingThreads,
      loadingMessages,
      error,
      loadThreads,
      loadMessages,
    ]
  );
}
