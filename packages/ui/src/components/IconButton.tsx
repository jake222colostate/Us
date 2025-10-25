import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export type IconButtonProps = {
  icon: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  style?: ViewStyle;
  glow?: boolean;
  disabled?: boolean;
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  size = 52,
  style,
  glow,
  disabled = false,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.surface,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          shadowColor: theme.shadows.soft.shadowColor,
          shadowOpacity: glow ? 0.5 : theme.shadows.soft.shadowOpacity,
          shadowRadius: theme.shadows.soft.shadowRadius,
          shadowOffset: theme.shadows.soft.shadowOffset,
          elevation: theme.shadows.soft.elevation,
          borderWidth: glow ? 2 : StyleSheet.hairlineWidth,
          borderColor: glow ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
