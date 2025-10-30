import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
} from "@/lib/api/endpoints";

export const useConversations = () =>
  useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: fetchConversations,
    staleTime: 15_000,
  });

export const useConversation = (conversationId: string | undefined) =>
  useQuery({
    queryKey: ["chat", "conversation", conversationId],
    queryFn: () => fetchConversation(conversationId as string),
    enabled: Boolean(conversationId),
    staleTime: 15_000,
  });

export const useMessages = (conversationId: string | undefined) =>
  useInfiniteQuery({
    queryKey: ["chat", "messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId as string, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(conversationId),
  });

export const useSendMessage = (conversationId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId as string, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "messages", conversationId],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat", "conversations"],
        refetchType: "active",
      });
    },
  });
};
