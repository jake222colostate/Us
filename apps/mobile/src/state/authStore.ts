import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../api/supabase';
import { createSignedPhotoUrl, mapPhotoRows, type PhotoResource, type PhotoRow } from '../lib/photos';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ModerationStatus = PhotoResource['status'];

export type UserPhoto = PhotoResource;

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  birthday?: string | null;
  age?: number | null;
  location?: string | null;
  avatar?: string | null;
  avatarStoragePath?: string | null;
  bio?: string | null;
  interests: string[];
  verificationStatus: VerificationStatus;
  photos: UserPhoto[];
};

type AuthState = {
  session: Session | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  verificationStatus: VerificationStatus;
  isPremium: boolean;
  setSession: (session: Session | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: { bio?: string; interests?: string[]; name?: string; location?: string | null }) => Promise<void>;
  setVerificationStatus: (status: VerificationStatus) => void;
  setUserPhotos: (photos: UserPhoto[]) => void;
  upsertUserPhoto: (photo: UserPhoto) => void;
  removeUserPhoto: (photoId: string) => void;
  setPremium: (value: boolean) => void;
  setAvatar: (storagePath: string | null) => Promise<void>;
};

function calculateAge(birthday: string | null | undefined): number | null {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

async function ensureProfile(userId: string, displayName: string, options?: {
  bio?: string;
  birthday?: string | null;
  interests?: string[];
  location?: string | null;
}) {
  const client = getSupabaseClient();
  const payload: Record<string, unknown> = {
    id: userId,
    display_name: displayName,
  };
  if (options?.bio !== undefined) payload.bio = options.bio;
  if (options?.birthday !== undefined) payload.birthday = options.birthday;
  if (options?.interests !== undefined) payload.interests = options.interests;
  if (options?.location !== undefined) payload.location = options.location;

  await client.from('profiles').upsert(payload, { onConflict: 'id' });
}

async function fetchProfile(session: Session): Promise<AuthenticatedUser> {
  const client = getSupabaseClient();
  const { data: profileRow, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profileRow) {
    const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New member';
    await ensureProfile(session.user.id, fallbackName);
    return fetchProfile(session);
  }

  const { data: photoRows, error: photosError } = await client
    .from('photos')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (photosError) {
    throw photosError;
  }

  const photos = await mapPhotoRows(((photoRows ?? []) as PhotoRow[]));
  const firstApproved = photos.find((photo) => photo.status === 'approved');
  const signedAvatar = profileRow.avatar_url
    ? await createSignedPhotoUrl(profileRow.avatar_url)
    : null;

  return {
    id: profileRow.id,
    email: session.user.email ?? null,
    name: profileRow.display_name ?? null,
    birthday: profileRow.birthday ?? null,
    age: calculateAge(profileRow.birthday ?? null),
    location: profileRow.location ?? null,
    avatar: signedAvatar ?? firstApproved?.url ?? null,
    avatarStoragePath: profileRow.avatar_url ?? firstApproved?.storagePath ?? null,
    bio: profileRow.bio ?? null,
    interests: Array.isArray(profileRow.interests) ? (profileRow.interests as string[]) : [],
    verificationStatus: profileRow.verification_status ?? 'unverified',
    photos,
  };
}

async function hydrateSession(
  session: Session | null,
  set: (updater: (prev: AuthState) => AuthState | Partial<AuthState> | AuthState) => void,
  get: () => AuthState,
) {
  console.log('🧩 hydrateSession', { hasSession: Boolean(session) });
  if (!session) {
    set((state) => ({
      ...state,
      session: null,
      user: null,
      isAuthenticated: false,
      verificationStatus: 'unverified',
      isInitialized: true,
    }));
    return;
  }

  set((state) => ({
    ...state,
    session,
    isAuthenticated: true,
    isInitialized: true,
  }));

  try {
    const profile = await fetchProfile(session);
    set((state) => ({
      ...state,
      user: profile,
      verificationStatus: profile.verificationStatus,
      isInitialized: true,
    }));
  } catch (error) {
    console.error('Failed to load profile', error);
    set((state) => ({
      ...state,
      user: null,
      verificationStatus: 'unverified',
      isInitialized: true,
    }));
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  verificationStatus: 'unverified',
  isPremium: false,
  async setSession(session) {
    console.log('📦 authStore.setSession', { hasSession: Boolean(session) });
    await hydrateSession(session, set, get);
  },
  async refreshProfile() {
    const session = get().session;
    if (!session) {
      return;
    }
    await hydrateSession(session, set, get);
  },
  async updateUser({ bio, interests, name, location }) {
    const session = get().session;
    if (!session) return;
    const client = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (bio !== undefined) payload.bio = bio;
    if (interests !== undefined) payload.interests = interests;
    if (name !== undefined) payload.display_name = name;
    if (location !== undefined) payload.location = location;
    if (Object.keys(payload).length === 0) {
      return;
    }
    const { data, error } = await client
      .from('profiles')
      .update(payload)
      .eq('id', session.user.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return;
    set((state) => ({
      ...state,
      user: state.user
        ? {
            ...state.user,
            name: data.display_name ?? state.user.name,
            bio: data.bio ?? state.user.bio,
            interests: Array.isArray(data.interests) ? (data.interests as string[]) : state.user.interests,
            location: data.location ?? state.user.location,
          }
        : state.user,
    }));
  },
  setVerificationStatus(status) {
    const session = get().session;
    set((state) => ({
      ...state,
      verificationStatus: status,
      user: state.user ? { ...state.user, verificationStatus: status } : state.user,
    }));
    if (session) {
      const client = getSupabaseClient();
      const updateVerificationStatus = async () => {
        try {
          await client
            .from('profiles')
            .update({ verification_status: status })
            .eq('id', session.user.id);
        } catch (error) {
          console.error('Failed to update verification status', error);
        }
      };
      void updateVerificationStatus();
    }
  },
  setUserPhotos(photos) {
    set((state) => ({
      ...state,
      user: state.user ? { ...state.user, photos } : state.user,
    }));
  },
  upsertUserPhoto(photo) {
    set((state) => {
      if (!state.user) {
        return state;
      }
      const index = state.user.photos.findIndex((item) => item.id === photo.id);
      const nextPhotos = [...state.user.photos];
      if (index >= 0) {
        nextPhotos[index] = photo;
      } else {
        nextPhotos.unshift(photo);
      }
      return {
        ...state,
        user: { ...state.user, photos: nextPhotos },
      };
    });
  },
  removeUserPhoto(photoId) {
    set((state) => {
      if (!state.user) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          photos: state.user.photos.filter((item) => item.id !== photoId),
        },
      };
    });
  },
  async setAvatar(storagePath) {
    const session = get().session;
    if (!session) return;
    const client = getSupabaseClient();
    const { error } = await client
      .from('profiles')
      .update({ avatar_url: storagePath })
      .eq('id', session.user.id);
    if (error) {
      throw error;
    }
    const signed = storagePath ? await createSignedPhotoUrl(storagePath) : null;
    set((state) => ({
      ...state,
      user: state.user
        ? { ...state.user, avatar: signed, avatarStoragePath: storagePath ?? null }
        : state.user,
    }));
  },
  setPremium(value) {
    set((state) => ({ ...state, isPremium: value }));
  },
}));

export const selectCurrentUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectVerificationStatus = (state: AuthState) => state.verificationStatus;
export const selectIsPremium = (state: AuthState) => state.isPremium;
export const selectSession = (state: AuthState) => state.session;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
