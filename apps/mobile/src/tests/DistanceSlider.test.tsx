import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, vi } from 'vitest';
import { DistanceSlider } from '@us/ui';

vi.mock('@react-native-community/slider', () => {
  const React = require('react');
  return ({ onValueChange }: { onValueChange: (val: number) => void }) => (
    <button data-testid="slider" onClick={() => onValueChange(20)} />
  );
});

describe('DistanceSlider', () => {
  it('calls change handler', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<DistanceSlider value={10} onChange={onChange} />);
    fireEvent.press(getByTestId('slider'));
    expect(onChange).toHaveBeenCalledWith(20);
  });
});
