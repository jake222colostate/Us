import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export interface AvatarProps {
  source: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 56, style }) => (
  <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
    <Image source={source} style={[styles.image, { borderRadius: size / 2 }]} resizeMode="cover" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
