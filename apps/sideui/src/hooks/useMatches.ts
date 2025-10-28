import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@us/auth";
import type { Match } from "@us/api-client";

type MatchListItem = {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  updatedAt?: string;
};

const toListItem = (match: Match & { profile?: Record<string, unknown>; last_message?: Record<string, unknown> }): MatchListItem => {
  const profile = match.profile as
    | {
        display_name?: string;
        photo_urls?: string[];
      }
    | undefined;
  const lastMessage = match.last_message as
    | {
        body?: string;
        created_at?: string;
      }
    | undefined;

  return {
    id: match.id,
    name: (profile?.display_name as string | undefined) ?? "Match",
    avatar: profile?.photo_urls?.[0] ?? "https://images.unsplash.com/photo-1521579971123-1192931a1452?w=400",
    lastMessage: lastMessage?.body as string | undefined,
    updatedAt: lastMessage?.created_at as string | undefined,
  };
};

export const useMatches = () => {
  const { api } = useAuth();
  const query = useQuery({
    queryKey: ["matches"],
    queryFn: () => api.matches.list(),
  });

  const matches = useMemo(() => {
    return (query.data ?? []).map((match) => toListItem(match as Match & { profile?: Record<string, unknown>; last_message?: Record<string, unknown> }));
  }, [query.data]);

  return {
    matches,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

