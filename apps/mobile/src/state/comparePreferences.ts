import { create } from 'zustand';

export type CompareLayout = 'vertical' | 'horizontal';

type ComparePreferencesState = {
  layout: CompareLayout;
  setLayout: (layout: CompareLayout) => void;
};

export const useComparePreferences = create<ComparePreferencesState>((set) => ({
  layout: 'vertical',
  setLayout: (layout) => set({ layout }),
}));
