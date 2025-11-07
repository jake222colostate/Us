import { create } from 'zustand';
import type { LookingFor } from '@us/types';

export type GenderFilter = LookingFor | 'everyone';

interface FeedPreferencesState {
  genderFilter: GenderFilter;
  setGenderFilter: (filter: GenderFilter) => void;
}

export const useFeedPreferencesStore = create<FeedPreferencesState>((set) => ({
  genderFilter: 'everyone',
  setGenderFilter: (filter) => set({ genderFilter: filter }),
}));
