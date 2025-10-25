import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, vi } from 'vitest';
import { ComposeScreen } from '../screens/main/ComposeScreen';
import { useComposerStore } from '../state/composerStore';

vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

vi.mock('expo-media-library', () => ({
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  saveToLibraryAsync: vi.fn().mockResolvedValue(undefined),
}));

describe('ComposeScreen', () => {
  it('toggles mirror state', () => {
    const { getByRole } = render(<ComposeScreen />);
    const initial = useComposerStore.getState().mirrorMine;
    const toggle = getByRole('switch');
    fireEvent(toggle, 'valueChange', !initial);
    expect(useComposerStore.getState().mirrorMine).toBe(!initial);
  });
});
