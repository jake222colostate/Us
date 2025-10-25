import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, vi } from 'vitest';
import { BigHeartButton } from '../features/feed/components/BigHeartButton';

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium' },
}));

vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('BigHeartButton', () => {
  it('invokes callback on press', () => {
    const onPress = vi.fn();
    const { getByLabelText } = render(<BigHeartButton onPress={onPress} />);
    fireEvent.press(getByLabelText('Send Big Heart'));
    expect(onPress).toHaveBeenCalled();
  });
});
