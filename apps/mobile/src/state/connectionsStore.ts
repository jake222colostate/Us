import { create } from 'zustand';
import type { SampleMatch, SampleProfile } from '../data/sampleProfiles';
import { sampleMatches } from '../data/sampleProfiles';

type ConnectionsState = {
  matches: SampleMatch[];
  unlockedProfileIds: string[];
  addMatch: (profile: SampleMatch | SampleProfile) => void;
  unmatch: (profileId: string) => void;
  unlockProfile: (profileId: string) => void;
  isMatched: (profileId: string) => boolean;
  isProfileAccessible: (profileId: string) => boolean;
};

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  matches: sampleMatches,
  unlockedProfileIds: [],
  addMatch: (profile) =>
    set((state) => {
      const exists = state.matches.some((match) => match.id === profile.id);
      if (exists) {
        return state;
      }
      const match: SampleMatch = {
        ...(profile as SampleMatch),
        matchPercent: 'matchPercent' in profile ? profile.matchPercent : 92,
        lastActive: 'lastActive' in profile ? profile.lastActive : 'Active now',
        lastMessage: 'lastMessage' in profile ? profile.lastMessage : 'New connection from the feed',
      };
      return { ...state, matches: [match, ...state.matches] };
    }),
  unmatch: (profileId) =>
    set((state) => ({
      matches: state.matches.filter((match) => match.id !== profileId),
      unlockedProfileIds: state.unlockedProfileIds.filter((id) => id !== profileId),
    })),
  unlockProfile: (profileId) =>
    set((state) => ({
      unlockedProfileIds: state.unlockedProfileIds.includes(profileId)
        ? state.unlockedProfileIds
        : [...state.unlockedProfileIds, profileId],
    })),
  isMatched: (profileId) => get().matches.some((match) => match.id === profileId),
  isProfileAccessible: (profileId) =>
    get().matches.some((match) => match.id === profileId) ||
    get().unlockedProfileIds.includes(profileId),
}));
