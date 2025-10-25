import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
  elevated?: boolean;
}>;

export const Card: React.FC<CardProps> = ({ children, style, elevated = true }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          ...(elevated ? theme.shadows.soft : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
