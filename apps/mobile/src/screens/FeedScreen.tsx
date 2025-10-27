import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../ui/theme';
import { Card, HStack, VStack, Pill, Avatar, ButtonPrimary } from '../components/UI';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

const profiles = [
  {
    name: 'Sarah, 26',
    distance: '3 miles away',
    time: '3m',
    bio: 'Living my best life ✨',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
  },
  {
    name: 'Emma, 24',
    distance: '5 miles away',
    time: '1h',
    bio: 'Coffee addict & bookworm.',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
  },
];

export default function FeedScreen({ navigation }: Props) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>Us</Text>

      {profiles.map((p, idx) => (
        <Card key={idx}>
          {/* header */}
          <View style={{ padding: 14 }}>
            <HStack gap={10}>
              <Avatar uri={p.avatar} size={36} />
              <VStack gap={4} style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{p.name}</Text>
                <HStack gap={10}>
                  <HStack gap={6}>
                    <Ionicons name="location" size={14} color={theme.sub} />
                    <Text style={{ color: theme.sub, fontSize: 12 }}>{p.distance}</Text>
                  </HStack>
                </HStack>
              </VStack>
            </HStack>
          </View>

          {/* photo */}
          <Image source={{ uri: p.photo }} style={{ width: '100%', height: 360, backgroundColor: '#111827' }} resizeMode="cover" />

          {/* footer */}
          <View style={{ padding: 14, gap: 12 }}>
            <HStack gap={12}>
              <Pill text="3m" icon={<Ionicons name="time" size={12} color={theme.text} />} />
              <Pill text="♡" />
            </HStack>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Sarah</Text>
            <Text style={{ color: theme.sub }}>{p.bio}</Text>

            <ButtonPrimary
              title="❤  Compare Photos Side by Side"
              onPress={() =>
                navigation.navigate('Compare', {
                  leftUri: p.photo,
                  rightUri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200',
                })
              }
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
