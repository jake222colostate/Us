import { create } from 'zustand';

const todayKey = () => new Date().toISOString().slice(0, 10);

type PostQuotaState = {
  lastReset: string | null;
  postedToday: number;
  resetIfNeeded: () => void;
  canPost: (limit: number) => boolean;
  markPosted: () => void;
};

export const usePostQuotaStore = create<PostQuotaState>((set, get) => ({
  lastReset: null,
  postedToday: 0,
  resetIfNeeded: () => {
    const key = todayKey();
    if (get().lastReset !== key) {
      set({ lastReset: key, postedToday: 0 });
    }
  },
  canPost: (limit) => {
    const state = get();
    state.resetIfNeeded();
    return state.postedToday < limit;
  },
  markPosted: () => {
    const state = get();
    state.resetIfNeeded();
    set({ lastReset: todayKey(), postedToday: state.postedToday + 1 });
  },
}));
