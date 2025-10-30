import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMatches, markMatchFromPost } from "@/lib/api/endpoints";

export const useMatches = () => {
  const queryClient = useQueryClient();

  const matchesQuery = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
    staleTime: 30_000,
  });

  const createFromPost = useMutation({
    mutationFn: (postId: string) => markMatchFromPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"], refetchType: "active" });
    },
  });

  return {
    matches: matchesQuery.data ?? [],
    isLoading: matchesQuery.isLoading,
    error: matchesQuery.error,
    refresh: matchesQuery.refetch,
    createFromPost,
  };
};
