import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export default function FeedScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0b0f19', padding: 16 }}>
      <Text style={{ color: 'white', fontSize: 18, marginBottom: 16 }}>Feed</Text>
      <Pressable
        onPress={() =>
          navigation.navigate('Compare', {
            leftUri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
            rightUri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
          })
        }
        style={{ backgroundColor: '#9b59b6', padding: 14, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
          Compare Photos Side by Side
        </Text>
      </Pressable>
    </View>
  );
}
