import React from 'react';
import { View, Image, useWindowDimensions, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

export default function CompareScreen({ route }: Props) {
  const params = route.params ?? {};
  const leftUri = params.leftUri ?? params.leftPhoto ?? null;
  const rightUri = params.rightUri ?? params.rightPhoto ?? null;
  const { width } = useWindowDimensions();
  const vertical = width < 700;

  const Item = ({ uri }: { uri?: string }) => (
    <Image
      source={{ uri: uri ?? '' }}
      style={{
        width: vertical ? width - 24 : (width - 48) / 2,
        height: vertical ? (width - 24) * 1.2 : ((width - 48) / 2) * 1.2,
        borderRadius: 12,
        backgroundColor: '#111827',
      }}
      resizeMode="cover"
    />
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b0f19' }} contentContainerStyle={{ padding: 12 }}>
      <View style={{
        flexDirection: vertical ? 'column' : 'row',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Item uri={leftUri ?? undefined} />
        <Item uri={rightUri ?? undefined} />
      </View>
    </ScrollView>
  );
}
