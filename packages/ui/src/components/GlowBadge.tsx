import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

type Props = {
  label: string;
};

export const GlowBadge: React.FC<Props> = ({ label }) => {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.glow,
        borderWidth: 2,
        borderColor: theme.colors.primary,
      }}
    >
      <Text weight="semibold" style={{ color: theme.colors.primary }}>
        {label}
      </Text>
    </View>
  );
};
