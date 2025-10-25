import { describe, expect, it } from 'vitest';
import { groupLikesByUser } from '../features/likes/utils';
import type { Heart, Profile, Post } from '@us/types';

const buildProfile = (overrides: Partial<Profile>): Profile => ({
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
  created_at: overrides.created_at ?? new Date().toISOString(),
  updated_at: overrides.updated_at ?? new Date().toISOString(),
});

const buildPost = (overrides: Partial<Post>): Post => ({
  id: overrides.id ?? 'post',
  user_id: overrides.user_id ?? 'user',
  photo_url: overrides.photo_url ?? 'https://example.com/photo.jpg',
  caption: overrides.caption ?? null,
  location: overrides.location ?? null,
  created_at: overrides.created_at ?? new Date().toISOString(),
  profile: overrides.profile,
});

const buildHeart = (overrides: Partial<Heart>): Heart => ({
  id: overrides.id ?? 'heart-default',
  post_id: overrides.post_id ?? 'post',
  from_user: overrides.from_user ?? 'user',
  to_user: overrides.to_user ?? 'recipient',
  kind: overrides.kind ?? 'normal',
  paid: overrides.paid ?? false,
  message: overrides.message ?? null,
  created_at: overrides.created_at ?? new Date().toISOString(),
  post: overrides.post,
  profile: overrides.profile,
});

describe('groupLikesByUser', () => {
  it('aggregates likes by liker and kind with latest timestamp ordering', () => {
    const ava = buildProfile({
      user_id: 'ava',
      username: 'ava',
      display_name: 'Ava',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    const ben = buildProfile({
      user_id: 'ben',
      username: 'ben',
      display_name: 'Ben',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });

    const hearts: Heart[] = [
      buildHeart({
        id: 'h1',
        post_id: 'p1',
        from_user: 'ava',
        created_at: '2024-01-01T01:00:00.000Z',
        post: buildPost({ id: 'p1', user_id: 'ava', created_at: '2024-01-01T01:00:00.000Z' }),
        profile: ava,
      }),
      buildHeart({
        id: 'h2',
        post_id: 'p2',
        from_user: 'ava',
        created_at: '2024-01-01T02:00:00.000Z',
        post: buildPost({ id: 'p2', user_id: 'ava', created_at: '2024-01-01T02:00:00.000Z' }),
        profile: ava,
      }),
      buildHeart({
        id: 'h3',
        post_id: 'p3',
        from_user: 'ben',
        kind: 'big',
        created_at: '2024-01-01T03:00:00.000Z',
        post: buildPost({ id: 'p3', user_id: 'ben', created_at: '2024-01-01T03:00:00.000Z' }),
        profile: ben,
      }),
      buildHeart({
        id: 'h4',
        post_id: 'p4',
        from_user: 'ben',
        kind: 'big',
        created_at: '2024-01-01T04:00:00.000Z',
        post: buildPost({ id: 'p4', user_id: 'ben', created_at: '2024-01-01T04:00:00.000Z' }),
        profile: ben,
      }),
    ];

    const grouped = groupLikesByUser(hearts);

    expect(grouped.normal).toHaveLength(1);
    expect(grouped.normal[0].fromUser).toBe('ava');
    expect(grouped.normal[0].count).toBe(2);
    expect(grouped.normal[0].latestAt).toBe('2024-01-01T02:00:00.000Z');
    expect(grouped.normal[0].hearts[0].id).toBe('h2');

    expect(grouped.big).toHaveLength(1);
    expect(grouped.big[0].fromUser).toBe('ben');
    expect(grouped.big[0].count).toBe(2);
    expect(grouped.big[0].latestAt).toBe('2024-01-01T04:00:00.000Z');
    expect(grouped.big[0].hearts[0].id).toBe('h4');
  });
});
