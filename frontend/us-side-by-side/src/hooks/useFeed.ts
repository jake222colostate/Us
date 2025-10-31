import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { dislikePost, fetchFeed, likePost, markMatchFromPost } from "@/lib/api/endpoints";
import type { FeedPost, PaginatedResponse } from "@/lib/api/types";

interface FeedReactionInput {
  postId: string;
  action: "like" | "dislike";
}

export const useFeed = () => {
  const queryClient = useQueryClient();

  const feedQuery = useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    getNextPageParam: (lastPage: PaginatedResponse<FeedPost>) => lastPage.nextCursor ?? undefined,
  });

  const invalidateFeed = () =>
    queryClient.invalidateQueries({ queryKey: ["feed"], refetchType: "active" });

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, action }: FeedReactionInput) => {
      if (action === "like") {
        return likePost(postId);
      }
      return dislikePost(postId);
    },
    onSuccess: () => invalidateFeed(),
  });

  const matchMutation = useMutation({
    mutationFn: (postId: string) => markMatchFromPost(postId),
    onSuccess: () => invalidateFeed(),
  });

  const posts = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    posts,
    isLoading: feedQuery.isLoading,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
    hasNextPage: feedQuery.hasNextPage,
    fetchNextPage: feedQuery.fetchNextPage,
    refetch: feedQuery.refetch,
    reactionMutation,
    matchMutation,
  };
};
