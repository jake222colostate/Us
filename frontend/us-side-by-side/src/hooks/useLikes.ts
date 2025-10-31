import { useQuery } from "@tanstack/react-query";

import { fetchLikes } from "@/lib/api/endpoints";

export const useLikes = () =>
  useQuery({
    queryKey: ["likes"],
    queryFn: fetchLikes,
    staleTime: 15_000,
  });
