import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@us/auth";
import type { Profile } from "@us/api-client";

export const useProfile = () => {
  const { api } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => api.users.getMe(),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Profile) => api.users.updateMe(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", "me"], updated);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refresh: profileQuery.refetch,
    update: updateMutation.mutateAsync,
    updating: updateMutation.isLoading,
  };
};

