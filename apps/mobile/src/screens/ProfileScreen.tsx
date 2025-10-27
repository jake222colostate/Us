import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Card, Avatar, HStack, VStack } from '../components/UI';
import { theme } from '../ui/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Header */}
      <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>Profile</Text>
        <Ionicons name="settings-outline" size={20} color={theme.text} />
      </HStack>

      {/* Profile card */}
      <Card style={{ padding: 18 }}>
        <VStack gap={14} style={{ alignItems: 'center' }}>
          <Avatar uri="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200" size={88} />
          <VStack style={{ alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 20 }}>You, 25</Text>
            <HStack gap={6}><Ionicons name="location" size={14} color={theme.sub} /><Text style={{ color: theme.sub }}>San Francisco, CA</Text></HStack>
          </VStack>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.pinkDark : theme.card,
              borderWidth: 1, borderColor: theme.border,
              paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
            })}
          >
            <HStack gap={8}><Ionicons name="create-outline" size={16} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '700' }}>Edit Profile</Text></HStack>
          </Pressable>
        </VStack>
      </Card>

      {/* Distance preference (visual-only slider) */}
      <Card style={{ padding: 18, gap: 12 }}>
        <HStack gap={8}><Ionicons name="locate-outline" size={16} color={theme.text} /><Text style={{ color: 'white', fontWeight: '800' }}>Distance Preference</Text></HStack>
        <Text style={{ color: theme.sub }}>Maximum Distance <Text style={{ color: 'white', fontWeight: '800' }}>25 miles</Text></Text>
        <View style={{ height: 6, backgroundColor: '#1f2937', borderRadius: 999, overflow: 'hidden' }}>
          <View style={{ width: '65%', height: '100%', backgroundColor: theme.pink }} />
        </View>
        <Text style={{ color: theme.sub, fontSize: 12 }}>You'll see people within 25 miles of your location</Text>
      </Card>

      {/* About me */}
      <Card style={{ padding: 18, gap: 10 }}>
        <Text style={{ color: 'white', fontWeight: '800' }}>About Me</Text>
        <Text style={{ color: theme.sub }}>
          Love coffee, hiking, and good conversation. Looking for someone to explore the city with!
        </Text>
      </Card>
    </ScrollView>
  );
}
