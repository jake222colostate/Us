import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import { LikesScreen } from '../screens/main/LikesScreen';
import type { LikeGroup } from '../features/likes/utils';
import type { Heart, Profile, Post } from '@us/types';

const navigate = vi.fn();

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate }),
}));

const profile = (overrides: Partial<Profile>): Profile => ({
  user_id: overrides.user_id ?? 'user',
  username: overrides.username ?? 'user',
  display_name: overrides.display_name ?? 'User',
  bio: overrides.bio ?? null,
  birthdate: overrides.birthdate ?? '1990-01-01',
  gender: overrides.gender ?? null,
  looking_for: overrides.looking_for ?? null,
  photo_urls: overrides.photo_urls ?? [],
  location: overrides.location ?? null,
  radius_km: overrides.radius_km ?? 25,
  created_at: overrides.created_at ?? '2024-01-01T00:00:00.000Z',
  updated_at: overrides.updated_at ?? '2024-01-01T00:00:00.000Z',
});

const post = (overrides: Partial<Post>): Post => ({
  id: overrides.id ?? 'post',
  user_id: overrides.user_id ?? 'user',
  photo_url: overrides.photo_url ?? 'https://example.com/photo.jpg',
  caption: overrides.caption ?? null,
  location: overrides.location ?? null,
  created_at: overrides.created_at ?? '2024-01-01T00:00:00.000Z',
  profile: overrides.profile,
});

const heart = (overrides: Partial<Heart>): Heart => ({
  id: overrides.id ?? 'heart',
  post_id: overrides.post_id ?? 'post',
  from_user: overrides.from_user ?? 'user',
  to_user: overrides.to_user ?? 'me',
  kind: overrides.kind ?? 'normal',
  paid: overrides.paid ?? false,
  message: overrides.message ?? null,
  created_at: overrides.created_at ?? '2024-01-01T00:00:00.000Z',
  post: overrides.post,
  profile: overrides.profile,
});

const likeGroups: { big: LikeGroup[]; normal: LikeGroup[] } = {
  big: [
    {
      fromUser: 'ben',
      profile: profile({ user_id: 'ben', username: 'ben', display_name: 'Ben' }),
      kind: 'big',
      count: 1,
      latestAt: '2024-01-01T05:00:00.000Z',
      hearts: [
        heart({
          id: 'hb1',
          from_user: 'ben',
          kind: 'big',
          created_at: '2024-01-01T05:00:00.000Z',
          post: post({ id: 'bp1', user_id: 'ben', created_at: '2024-01-01T05:00:00.000Z' }),
          profile: profile({ user_id: 'ben', username: 'ben', display_name: 'Ben' }),
        }),
      ],
    },
  ],
  normal: [
    {
      fromUser: 'ava',
      profile: profile({ user_id: 'ava', username: 'ava', display_name: 'Ava' }),
      kind: 'normal',
      count: 2,
      latestAt: '2024-01-01T02:00:00.000Z',
      hearts: [
        heart({
          id: 'ha1',
          from_user: 'ava',
          created_at: '2024-01-01T01:00:00.000Z',
          post: post({ id: 'ap1', user_id: 'ava', created_at: '2024-01-01T01:00:00.000Z' }),
          profile: profile({ user_id: 'ava', username: 'ava', display_name: 'Ava' }),
        }),
        heart({
          id: 'ha2',
          from_user: 'ava',
          created_at: '2024-01-01T02:00:00.000Z',
          post: post({ id: 'ap2', user_id: 'ava', created_at: '2024-01-01T02:00:00.000Z' }),
          profile: profile({ user_id: 'ava', username: 'ava', display_name: 'Ava' }),
        }),
      ],
    },
  ],
};

vi.mock('../features/likes/hooks', () => ({
  useLikesQuery: () => ({ data: likeGroups, isLoading: false }),
}));

describe('LikesScreen', () => {
  it('shows aggregated like counts and expands to reveal individual likes', () => {
    const { getByText, getByLabelText, queryAllByText } = render(<LikesScreen />);

    expect(getByText('Big Hearts ✨')).toBeTruthy();
    expect(getByText('Ava liked 2 of your posts')).toBeTruthy();
    expect(queryAllByText('Us Photo')).toHaveLength(0);

    fireEvent.press(getByLabelText('Expand likes from Ava'));

    expect(queryAllByText('Us Photo')).toHaveLength(2);
  });
});
