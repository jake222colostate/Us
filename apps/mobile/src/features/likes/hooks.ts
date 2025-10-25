import { useQuery } from '@tanstack/react-query';
import { fetchLikes } from '../profile/api';
import { useAuth } from '../../providers/AuthProvider';
import { groupLikesByUser } from './utils';
import type { LikeGroupsByKind } from './utils';

export function useLikesQuery() {
  const { session } = useAuth();
  return useQuery<LikeGroupsByKind>({
    queryKey: ['likes', session?.user.id],
    queryFn: async () => {
      if (!session) return { big: [], normal: [] };
      const likes = await fetchLikes(session.user.id);
      return groupLikesByUser(likes);
    },
  });
}
