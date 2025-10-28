import { useQuery } from "@tanstack/react-query";
import { useAuth } from '../../packages/auth/src';
import type { Notification } from '../../packages/api-client/src';

export const useNotifications = () => {
  const { api } = useAuth();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
  });

  return {
    notifications: (query.data ?? []) as Notification[],
    isLoading: query.isLoading,
    error: query.error,
    markRead: (id: string) => api.notifications.markRead(id),
    refetch: query.refetch,
  };
};

