import { create } from 'zustand';
import { getSupabaseClient } from '../api/supabase';
import { isTableMissingError, logTableMissingWarning } from '../api/postgrestErrors';
import { mapPhotoRows, type PhotoRow, createSignedPhotoUrl } from '../lib/photos';
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
  verification_status: VerificationStatus;
  avatar_url: string | null;
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
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageFromSelf: boolean | null;
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
    .select('id, display_name, bio, verification_status, avatar_url')
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
      const approvedPhotos = photos.filter((photo) => photo.status === 'approved' && photo.url);
      const firstPhoto = approvedPhotos[0] ?? null;

      let lastMessageRow: { body: string; created_at: string } | null = null;
      const { data: lastMessages, error: lastError } = await client
        .from('messages')
        .select('body, created_at')
        .eq('match_id', row.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastError) {
        if (isTableMissingError(lastError, 'messages')) {
          logTableMissingWarning('messages', lastError);
        } else {
          throw lastError;
        }
      } else if (lastMessages && lastMessages.length > 0) {
        lastMessageRow = lastMessages[0] as { body: string; created_at: string };
      }

      const avatarStoragePath = profile?.avatar_url ?? null;
      const signedAvatar = await createSignedPhotoUrl(avatarStoragePath);
      const avatarUrl = signedAvatar ?? avatarStoragePath ?? firstPhoto?.url ?? null;

      return {
        matchId: row.id,
        userId: partnerId,
        name: profile?.display_name ?? 'New member',
        bio: profile?.bio ?? null,
        avatar: avatarUrl,
        verificationStatus: profile?.verification_status ?? 'unverified',
        photos: approvedPhotos,
        createdAt: row.created_at,
        lastMessage: lastMessageRow?.body ?? null,
        lastMessageAt: lastMessageRow?.created_at ?? null,
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
      if (isTableMissingError(error, 'matches')) {
        logTableMissingWarning('matches', error);
        set((state) => ({ ...state, matches: [], isLoading: false, error: null }));
        return;
      }
      console.error('❌ Failed to load matches from Supabase', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      set((state) => ({
        ...state,
        isLoading: false,
        error: `Unable to load matches from Supabase: ${message}`,
      }));
      throw error;
    }
  },
  clear() {
    set({ matches: [], error: null, isLoading: false });
  },
}));
