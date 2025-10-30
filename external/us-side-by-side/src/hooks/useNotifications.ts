import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchNotifications } from "@/lib/api/endpoints";

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 15_000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      // Placeholder for backend endpoint until available
      return Promise.resolve();
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
    markAllAsRead,
  };
};
