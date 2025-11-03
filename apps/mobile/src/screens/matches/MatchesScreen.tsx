import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSampleMatches } from '../../hooks/useSampleData';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';

export default function MatchesScreen() {
  const matches = useSampleMatches();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Matches'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={matches.filter((item) =>
          (item.photos ?? []).some((photo) => photo?.status === 'approved' && photo?.url),
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Matches</Text>
            <Text style={styles.subtitle}>Everyone here already liked you back.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyCopy}>Keep exploring the feed — we’ll drop your matches here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const approvedPhotos = (item.photos ?? []).filter(
                (photo) => photo?.status === 'approved' && photo?.url,
              );
              const leftPhoto = approvedPhotos[0]?.url ?? null;
              const rightPhoto = approvedPhotos[1]?.url ?? approvedPhotos[0]?.url ?? null;

              navigation.navigate('Compare', {
                leftPhoto,
                rightPhoto,
                profile: item,
              });
            }}
            style={({ pressed }) => [styles.matchCard, pressed && styles.matchCardPressed]}
          >
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>No photo</Text>
              </View>
            )}
            <View style={styles.matchInfo}>
              <Text style={styles.matchName}>
                {item.name}
                <Text style={styles.matchPercent}> • {item.matchPercent}% match</Text>
              </Text>
              <Text style={styles.matchMeta}>{item.lastActive}</Text>
              <Text style={styles.matchMessage}>{item.lastMessage}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2e',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  matchCardPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111b2e',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  avatarPlaceholderText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  matchPercent: {
    fontSize: 16,
    color: '#a855f7',
    fontWeight: '600',
  },
  matchMeta: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 13,
  },
  matchMessage: {
    color: '#cbd5f5',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    marginTop: 120,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyCopy: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
