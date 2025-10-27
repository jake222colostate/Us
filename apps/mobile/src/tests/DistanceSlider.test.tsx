import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, vi } from 'vitest';
import { DistanceSlider } from '@us/ui';

vi.mock('@react-native-community/slider', () => {
  const MockSlider: React.FC<{ onValueChange: (val: number) => void }> = ({ onValueChange }) => (
    <button data-testid="slider" onClick={() => onValueChange(20)} />
  );
  MockSlider.displayName = 'MockSlider';
  return { default: MockSlider };
});

describe('DistanceSlider', () => {
  it('calls change handler', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<DistanceSlider value={10} onChange={onChange} />);
    fireEvent.press(getByTestId('slider'));
    expect(onChange).toHaveBeenCalledWith(20);
  });
});
