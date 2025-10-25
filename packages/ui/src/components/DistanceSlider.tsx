import React from 'react';
import Slider from '@react-native-community/slider';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: 'mi' | 'km';
};

export const DistanceSlider: React.FC<Props> = ({ value, onChange, min = 1, max = 100, unit = 'mi' }) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text weight="semibold">Distance</Text>
        <Text weight="bold">{Math.round(value)} {unit}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={(val) => onChange(Math.round(val))}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.surfaceMuted}
        thumbTintColor={theme.colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
