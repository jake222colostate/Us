import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@us/auth";
import type { ApiClient } from "@us/api-client";

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt?: string;
  isSelf: boolean;
};

export type ChatHeader = {
  id: string;
  name: string;
  avatar: string;
};

export const useChat = (matchId?: string) => {
  const { api, user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<{ match: Awaited<ReturnType<ApiClient["matches"]["get"]>>["match"]; messages: Awaited<ReturnType<ApiClient["matches"]["get"]>>["messages"] }>({
    queryKey: ["match", matchId],
    queryFn: () => (matchId ? api.matches.get(matchId) : Promise.reject(new Error("Missing match id"))),
    enabled: Boolean(matchId),
  });

  const match = query.data?.match as (typeof query.data)["match"] & {
    profile?: { display_name?: string; photo_urls?: string[] };
  } | undefined;

  const header: ChatHeader | null = useMemo(() => {
    if (!match) return null;
    const profile = match.profile;
    return {
      id: match.id,
      name: profile?.display_name ?? "Match",
      avatar: profile?.photo_urls?.[0] ?? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    };
  }, [match]);

  const messages: ChatMessage[] = useMemo(() => {
    const list = query.data?.messages ?? [];
    return list.map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      body: message.body,
      createdAt: message.created_at,
      isSelf: message.sender_id === (user as { id?: string })?.id,
    }));
  }, [query.data?.messages, user]);

  const sendMutation = useMutation({
    mutationFn: async (payload: { matchId: string; text: string }) => {
      const { matchId: id, text } = payload;
      const message = await api.matches.sendMessage(id, text);
      return message;
    },
    onSuccess: (message, variables) => {
      const { matchId: messageMatchId } = variables;
      queryClient.setQueryData(["match", messageMatchId], (previous: unknown) => {
        if (!previous || typeof previous !== "object") return previous;
        const current = previous as { match: typeof match; messages: typeof query.data?.messages };
        if (!current.messages) return previous;
        return {
          ...current,
          messages: [...current.messages, message],
        };
      });
    },
  });

  return {
    header,
    messages,
    isLoading: query.isLoading,
    error: query.error,
    send: (text: string) => (matchId ? sendMutation.mutateAsync({ matchId, text }) : Promise.reject(new Error("Missing match id"))),
    sending: sendMutation.isLoading,
  };
};

