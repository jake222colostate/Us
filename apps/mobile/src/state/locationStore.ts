import create from 'zustand';
import type { Profile } from '@us/types';

type State = {
  radiusKm: number;
  profile: Profile | null;
  setRadius: (radius: number) => void;
  setProfile: (profile: Profile) => void;
};

export const useLocationStore = create<State>((set) => ({
  radiusKm: 40,
  profile: null,
  setRadius: (radiusKm) => set({ radiusKm }),
  setProfile: (profile) => set({ profile }),
}));
