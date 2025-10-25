import React, { useMemo } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

const shimmer = new Animated.Value(0);
Animated.loop(
  Animated.sequence([
    Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
    Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
  ]),
).start();

type Props = {
  style?: ViewStyle;
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
};

export const Skeleton: React.FC<Props> = ({ style, rounded = 'md' }) => {
  const theme = useTheme();
  const borderRadius = useMemo(() => theme.radii[rounded] ?? theme.radii.md, [rounded, theme]);
  return (
    <Animated.View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius,
          opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
