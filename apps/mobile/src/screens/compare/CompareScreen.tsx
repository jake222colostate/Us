import React from 'react';
import { View, Image, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Params = { left: string; right: string };
type Props = NativeStackScreenProps<any, any>;

export default function CompareScreen({ route }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const left = (route.params as Params)?.left;
  const right = (route.params as Params)?.right ?? left;

  return (
    <View style={{ flex:1, backgroundColor:'#0b1220', padding:12, flexDirection:isWide?'row':'column', gap:12 as any }}>
      <Image source={{ uri: left }}  style={{ flex:1, height:isWide?undefined:320, borderRadius:12 }} resizeMode="cover" />
      <Image source={{ uri: right }} style={{ flex:1, height:isWide?undefined:320, borderRadius:12 }} resizeMode="cover" />
    </View>
  );
}
