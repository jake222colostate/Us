import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card, HStack, VStack, Avatar } from '../components/UI';
import { theme } from '../ui/theme';

const matches = [
  { name: 'Sarah, 26', msg: "Hey! How's it going?", time: '2m', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
  { name: 'Emma, 24', msg: 'Thanks for matching! 😊', time: '1h', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200' },
];

export default function MatchesScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 8 }}>Matches</Text>
      {matches.map((m, i) => (
        <Card key={i} style={{ padding: 14 }}>
          <HStack gap={12} style={{ justifyContent: 'space-between' }}>
            <HStack gap={12}>
              <Avatar uri={m.avatar} size={38} />
              <VStack gap={4}>
                <Text style={{ color: 'white', fontWeight: '700' }}>{m.name}</Text>
                <Text style={{ color: theme.sub }}>{m.msg}</Text>
              </VStack>
            </HStack>
            <Text style={{ color: theme.sub }}>{m.time} ago</Text>
          </HStack>
        </Card>
      ))}
    </ScrollView>
  );
}
