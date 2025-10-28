import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@us/auth";
import type { Profile } from "@us/api-client";

export const useUserProfile = (userId?: string) => {
  const { api } = useAuth();

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => (userId ? api.users.getUser(userId) : Promise.reject(new Error("Missing user id"))),
    enabled: Boolean(userId),
  });

  return {
    profile: query.data as Profile | undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
};

