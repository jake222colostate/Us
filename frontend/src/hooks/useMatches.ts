import { useEffect, useState } from 'react';

import { apiClient, type ApiError } from '../api/client';

type MatchItem = {
  id: string;
  name: string;
  compatibility: number;
};

type MatchesState = {
  data: MatchItem[];
  loading: boolean;
  error: string | null;
};

const FALLBACK_MATCHES: MatchItem[] = [
  { id: 'a', name: 'Jordan', compatibility: 92 },
  { id: 'b', name: 'Taylor', compatibility: 88 },
];

export function useMatches(): MatchesState {
  const [state, setState] = useState<MatchesState>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiClient.get<MatchItem[]>('/matches');
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        const message = (error as ApiError).message ?? 'Unable to load matches';
        if (!cancelled) {
          setState({ data: FALLBACK_MATCHES, loading: false, error: message });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
