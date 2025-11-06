import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text as RNText } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  message: string;
  visible: boolean;
};

export const Toast: React.FC<Props> = ({ message, visible }) => {
  const translate = useRef(new Animated.Value(80)).current;
  const theme = useTheme();

  useEffect(() => {
    Animated.timing(translate, {
      toValue: visible ? 0 : 80,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, translate]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: translate }],
          backgroundColor: theme.colors?.overlay ?? 'rgba(0,0,0,0.85)',
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <RNText style={[styles.text, { color: theme.colors?.onOverlay ?? '#fff' }]}>
          {message}
        </RNText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inner: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, fontWeight: '600' },
});
