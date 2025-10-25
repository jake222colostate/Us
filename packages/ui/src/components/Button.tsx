import React from 'react';
import { Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { Text } from './Text';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  disabled,
  variant = 'primary',
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const content = (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          backgroundColor:
            variant === 'ghost'
              ? 'transparent'
              : variant === 'secondary'
              ? theme.colors.surfaceMuted
              : theme.colors.primary,
          borderRadius: theme.radii.xl,
        },
        style,
      ]}
      disabled={disabled}
    >
      <LinearGradient
        colors={
          variant === 'primary'
            ? ['#FF4F8B', '#FF8BA7']
            : variant === 'secondary'
            ? [theme.colors.surfaceMuted, theme.colors.surfaceMuted]
            : ['transparent', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {leftIcon}
        <Text
          weight="semibold"
          style={[
            styles.label,
            { color: variant === 'ghost' ? theme.colors.text : '#FFFFFF' },
            textStyle,
          ]}
        >
          {label}
        </Text>
        {rightIcon}
      </LinearGradient>
    </Pressable>
  );

  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          {
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
            borderRadius: theme.radii.xl,
          },
          style,
        ]}
        disabled={disabled}
      >
        <Text weight="semibold" style={[styles.label, { color: theme.colors.primary }, textStyle]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  label: {
    fontSize: 16,
  },
});
