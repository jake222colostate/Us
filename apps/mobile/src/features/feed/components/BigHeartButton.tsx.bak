import React, { useCallback, useRef } from 'react';
import { Animated, Easing, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type BigHeartButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
};

export const BigHeartButton: React.FC<BigHeartButtonProps> = ({ onPress, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const trigger = useCallback(() => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
      ]),
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
    ]).start();
    onPress?.();
  }, [disabled, glow, onPress, scale]);

  const glowColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,79,139,0.2)', 'rgba(255,79,139,0.65)'] });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          shadowColor: '#FF4F8B',
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View style={[styles.glow, { backgroundColor: glowColor }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Send Big Heart" onPress={trigger}>
        <MaterialCommunityIcons name="heart-flash" color="#FF4F8B" size={36} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 40,
    padding: 8,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
  },
});
