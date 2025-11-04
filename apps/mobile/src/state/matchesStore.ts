import { create } from 'zustand';
import { getSupabaseClient } from '../api/supabase';
import { mapPhotoRows, type PhotoRow } from '../lib/photos';
import type { VerificationStatus, UserPhoto } from './authStore';

type MatchRecord = {
  id: string;
  created_at: string;
  user_a: string;
  user_b: string;
};

type ProfileRecord = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  verification_status: VerificationStatus;
};

type MatchProfile = {
  matchId: string;
  userId: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  verificationStatus: VerificationStatus;
  photos: UserPhoto[];
  createdAt: string;
};

type MatchesState = {
  matches: MatchProfile[];
  isLoading: boolean;
  error: string | null;
  fetchMatches: (userId: string) => Promise<void>;
  clear: () => void;
};

async function fetchMatchesFromSupabase(userId: string): Promise<MatchProfile[]> {
  const client = getSupabaseClient();
  const { data: matchRows, error: matchesError } = await client
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (matchesError) throw matchesError;

  const rows = (matchRows ?? []) as MatchRecord[];
  if (rows.length === 0) {
    return [];
  }

  const otherUserIds = Array.from(
    new Set(rows.map((row) => (row.user_a === userId ? row.user_b : row.user_a))),
  );

  const { data: profilesData, error: profilesError } = await client
    .from('profiles')
    .select('id, display_name, bio, avatar_url, verification_status')
    .in('id', otherUserIds);
  if (profilesError) throw profilesError;
  const profileMap = new Map<string, ProfileRecord>(
    (profilesData as ProfileRecord[] | null)?.map((profile) => [profile.id, profile]) ?? [],
  );

  const { data: photosData, error: photosError } = await client
    .from('photos')
    .select('*')
    .in('user_id', otherUserIds);
  if (photosError) throw photosError;

  const photosByUser = new Map<string, PhotoRow[]>();
  (photosData as PhotoRow[] | null)?.forEach((row) => {
    const list = photosByUser.get(row.user_id) ?? [];
    list.push(row);
    photosByUser.set(row.user_id, list);
  });

  return Promise.all(
    rows.map(async (row) => {
      const partnerId = row.user_a === userId ? row.user_b : row.user_a;
      const profile = profileMap.get(partnerId);
      const photoRows = photosByUser.get(partnerId) ?? [];
      const photos = await mapPhotoRows(photoRows);
      const firstPhoto = photos.find((photo) => photo.status === 'approved');
      return {
        matchId: row.id,
        userId: partnerId,
        name: profile?.display_name ?? 'New member',
        bio: profile?.bio ?? null,
        avatar: profile?.avatar_url ?? firstPhoto?.url ?? null,
        verificationStatus: profile?.verification_status ?? 'unverified',
        photos,
        createdAt: row.created_at,
      } satisfies MatchProfile;
    }),
  );
}

export const useMatchesStore = create<MatchesState>((set) => ({
  matches: [],
  isLoading: false,
  error: null,
  async fetchMatches(userId) {
    set((state) => ({ ...state, isLoading: true, error: null }));
    try {
      const nextMatches = await fetchMatchesFromSupabase(userId);
      set((state) => ({ ...state, matches: nextMatches, isLoading: false }));
    } catch (error) {
      console.error(error);
      set((state) => ({
        ...state,
        isLoading: false,
        error: 'Unable to load matches from Supabase.',
      }));
    }
  },
  clear() {
    set({ matches: [], error: null, isLoading: false });
  },
}));
