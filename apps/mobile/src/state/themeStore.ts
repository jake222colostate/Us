import { create } from 'zustand';

type ThemeState = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggle: () => void;
};

const defaultDarkMode = true;

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: defaultDarkMode,
  setDarkMode: (value) => set({ isDarkMode: value }),
  toggle: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
