import create from 'zustand';
import type { UsComposerAspect } from '@us/types';

type ComposerState = {
  myPhotoUri: string | null;
  theirPhotoUri: string | null;
  aspect: UsComposerAspect;
  mirrorMine: boolean;
  setMyPhoto: (uri: string | null) => void;
  setTheirPhoto: (uri: string | null) => void;
  setAspect: (aspect: UsComposerAspect) => void;
  toggleMirror: () => void;
  reset: () => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  myPhotoUri: null,
  theirPhotoUri: null,
  aspect: '4:5',
  mirrorMine: false,
  setMyPhoto: (uri) => set({ myPhotoUri: uri }),
  setTheirPhoto: (uri) => set({ theirPhotoUri: uri }),
  setAspect: (aspect) => set({ aspect }),
  toggleMirror: () => set((state) => ({ mirrorMine: !state.mirrorMine })),
  reset: () => set({ myPhotoUri: null, theirPhotoUri: null, aspect: '4:5', mirrorMine: false }),
}));
