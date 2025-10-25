import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  uri?: string | null;
  size?: number;
  label?: string;
};

export const Avatar: React.FC<Props> = ({ uri, size = 64, label }) => {
  const theme = useTheme();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: theme.colors.surfaceMuted }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      }}
    >
      <Text weight="semibold">{label?.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
};
