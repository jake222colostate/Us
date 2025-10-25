import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

type Props = {
  message: string;
  visible: boolean;
};

export const Toast: React.FC<Props> = ({ message, visible }) => {
  const translate = React.useRef(new Animated.Value(80)).current;
  const theme = useTheme();

  useEffect(() => {
    Animated.spring(translate, {
      toValue: visible ? 0 : 80,
      useNativeDriver: true,
    }).start();
  }, [translate, visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          transform: [{ translateY: translate }],
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text weight="semibold">{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
