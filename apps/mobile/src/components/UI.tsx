import React from 'react';
import { View, Text, Image, Pressable, ViewStyle, TextStyle, ImageStyle, StyleProp } from 'react-native';
import { theme } from '../ui/theme';

export const Card: React.FC<{ style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({ style, children }) => (
  <View style={[{
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden',
  }, style]}>{children}</View>
);

export const HStack: React.FC<{ gap?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }> =
  ({ gap = 8, style, children }) => (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style as ViewStyle]}>
      {React.Children.map(children, (c, i) => <View style={{ marginRight: i < React.Children.count(children)-1 ? gap : 0 }}>{c}</View>)}
    </View>
  );

export const VStack: React.FC<{ gap?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }> =
  ({ gap = 8, style, children }) => (
    <View style={[{ flexDirection: 'column' }, style as ViewStyle]}>
      {React.Children.map(children, (c, i) => <View style={{ marginBottom: i < React.Children.count(children)-1 ? gap : 0 }}>{c}</View>)}
    </View>
  );

export const Pill: React.FC<{ text: string; icon?: React.ReactNode; style?: StyleProp<ViewStyle | TextStyle> }> =
  ({ text, icon, style }) => (
    <HStack gap={6} style={[{
      paddingHorizontal: 10, paddingVertical: 6,
      backgroundColor: '#1f2937', borderRadius: 999,
    }, style as ViewStyle]}>
      {icon}
      <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12 }}>{text}</Text>
    </HStack>
  );

export const ButtonPrimary: React.FC<{ title: string; onPress: () => void; style?: StyleProp<ViewStyle | TextStyle> }> =
  ({ title, onPress, style }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        paddingVertical: 14, borderRadius: 999,
        backgroundColor: pressed ? theme.pinkDark : theme.pink,
      }, style as ViewStyle]}>
      <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );

export const Avatar: React.FC<{ uri: string; size?: number; style?: StyleProp<ImageStyle> }> =
  ({ uri, size = 28, style }) => (
    <Image source={{ uri }} style={[{
      width: size, height: size, borderRadius: size/2, backgroundColor: '#111827',
      borderWidth: 2, borderColor: '#f472b6',
    }, style]} />
  );
