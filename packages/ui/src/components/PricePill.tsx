import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

type Props = {
  amount: string;
};

export const PricePill: React.FC<Props> = ({ amount }) => {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      }}
    >
      <Text weight="semibold">{amount}</Text>
    </View>
  );
};
