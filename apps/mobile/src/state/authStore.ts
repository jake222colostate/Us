import { create } from 'zustand';
import type { VerificationStatus } from '@us/api-client';
import type { ModeratedPhoto, SampleUser } from '../data/sampleProfiles';
import { demoUser } from '../data/sampleProfiles';

type SignInPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  age?: string;
  location?: string;
  bio?: string;
  interests?: string;
};

type AuthState = {
  user: SampleUser | null;
  isAuthenticated: boolean;
  verificationStatus: VerificationStatus;
  isPremium: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => void;
  updateUser: (updates: Partial<SampleUser>) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  setUserPhotos: (photos: ModeratedPhoto[]) => void;
  upsertUserPhoto: (photo: ModeratedPhoto) => void;
  removeUserPhoto: (photoId: string) => void;
  setPremium: (value: boolean) => void;
};

const parseInterests = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  verificationStatus: 'unverified',
  isPremium: false,
  async signIn({ email }) {
    set({
      user: { ...demoUser, email },
      isAuthenticated: true,
      verificationStatus: demoUser.verificationStatus,
      isPremium: false,
    });
  },
  async signUp({ name, email, age, location, bio, interests }) {
    const parsedAge = Number(age);
    const interestList = parseInterests(interests);

    set({
      user: {
        id: `user-${Date.now()}`,
        name: name || demoUser.name,
        email,
        age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : demoUser.age,
        location: location || demoUser.location,
        avatar: demoUser.avatar,
        bio: bio || demoUser.bio,
        interests: interestList.length > 0 ? interestList : demoUser.interests,
        verificationStatus: 'unverified',
        photos: demoUser.photos,
      },
      isAuthenticated: true,
      verificationStatus: 'unverified',
      isPremium: false,
    });
  },
  signOut() {
    set({ user: null, isAuthenticated: false, verificationStatus: 'unverified', isPremium: false });
  },
  updateUser(updates) {
    set((state) => {
      if (!state.user) {
        return state;
      }

      return {
        ...state,
        user: {
          ...state.user,
          ...updates,
          interests: updates.interests ?? state.user.interests,
        },
      };
    });
  },
  setVerificationStatus(status) {
    set((state) => ({
      verificationStatus: status,
      user: state.user ? { ...state.user, verificationStatus: status } : state.user,
    }));
  },
  setUserPhotos(photos) {
    set((state) => ({
      user: state.user ? { ...state.user, photos } : state.user,
    }));
  },
  upsertUserPhoto(photo) {
    set((state) => {
      if (!state.user) {
        return state;
      }

      const existingIndex = state.user.photos.findIndex((item) => item.id === photo.id);
      const nextPhotos = [...state.user.photos];
      if (existingIndex >= 0) {
        nextPhotos[existingIndex] = photo;
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
        user: { ...state.user, photos: state.user.photos.filter((item) => item.id !== photoId) },
      };
    });
  },
  setPremium(value) {
    set((state) => ({
      isPremium: value,
      user: state.user ? { ...state.user, verificationStatus: state.verificationStatus } : state.user,
    }));
  },
}));

export const selectCurrentUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectVerificationStatus = (state: AuthState) => state.verificationStatus;
export const selectIsPremium = (state: AuthState) => state.isPremium;
