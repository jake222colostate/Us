import type { Heart, Profile } from '@us/types';

export type LikeGroup = {
  fromUser: string;
  profile?: Profile;
  kind: 'normal' | 'big';
  count: number;
  latestAt: string;
  hearts: Heart[];
};

export type LikeGroupsByKind = {
  big: LikeGroup[];
  normal: LikeGroup[];
};

export function groupLikesByUser(likes: Heart[]): LikeGroupsByKind {
  const bigMap = new Map<string, Heart[]>();
  const normalMap = new Map<string, Heart[]>();

  likes.forEach((like) => {
    const target = like.kind === 'big' ? bigMap : normalMap;
    const existing = target.get(like.from_user) ?? [];
    existing.push(like);
    target.set(like.from_user, existing);
  });

  const createGroups = (map: Map<string, Heart[]>, kind: 'normal' | 'big') =>
    Array.from(map.entries())
      .map<LikeGroup>(([fromUser, entries]) => {
        const sorted = entries
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          fromUser,
          profile: sorted[0]?.profile as Profile | undefined,
          kind,
          count: sorted.length,
          latestAt: sorted[0]?.created_at ?? new Date(0).toISOString(),
          hearts: sorted,
        };
      })
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  return {
    big: createGroups(bigMap, 'big'),
    normal: createGroups(normalMap, 'normal'),
  };
}
