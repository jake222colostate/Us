import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeed } from './api';
import { useAuth } from '../../providers/AuthProvider';
import { useLocationStore } from '../../state/locationStore';

const PAGE_SIZE = 12;

export function useFeedQuery() {
  const { session } = useAuth();
  const radiusKm = useLocationStore((state) => state.radiusKm);

  const query = useInfiniteQuery({
    queryKey: ['feed', session?.user.id, radiusKm],
    queryFn: async ({ pageParam = 0 }) => {
      if (!session) return { posts: [], nextOffset: null };
      const posts = await fetchFeed({
        limit: PAGE_SIZE,
        offset: pageParam,
        viewerId: session.user.id,
        radiusKm,
      });
      
      
      return {
        posts,
        nextOffset: posts.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  return query;
}
