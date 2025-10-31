import { useQuery } from "@tanstack/react-query";

import { fetchHealth, fetchReady } from "@/lib/api/endpoints";
import type { HealthResponse } from "@/lib/api/types";

const HEALTH_QUERY_KEY = ["api-health"] as const;

const fetcher = async (): Promise<HealthResponse> => {
  try {
    return await fetchHealth();
  } catch (error) {
    return fetchReady();
  }
};

export const useApiHealth = () =>
  useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: fetcher,
    refetchInterval: 60_000,
    retry: 1,
  });
