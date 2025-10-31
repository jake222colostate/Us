import { useEffect, useState } from 'react';

import { apiClient, type ApiError } from '../api/client';

type FeedItem = {
  id: string;
  title: string;
  summary: string;
};

type FeedState = {
  data: FeedItem[];
  loading: boolean;
  error: string | null;
};

const FALLBACK_FEED: FeedItem[] = [
  { id: '1', title: 'Welcome to US', summary: 'Start curating your connections with a refreshed unified experience.' },
  { id: '2', title: 'Stay in sync', summary: 'Real-time updates across web and native keep your matches aligned.' },
];

export function useFeed(): FeedState {
  const [state, setState] = useState<FeedState>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiClient.get<FeedItem[]>('/feed');
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        const message = (error as ApiError).message ?? 'Unable to load feed';
        if (!cancelled) {
          setState({ data: FALLBACK_FEED, loading: false, error: message });
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
