import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import { useSampleProfiles } from '../../hooks/useSampleData';
import type { SampleProfile } from '../../data/sampleProfiles';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';

export default function FeedScreen() {
  const profiles = useSampleProfiles();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Feed'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const approvedProfiles = useMemo(
    () =>
      profiles.filter((profile) =>
        (profile?.photos ?? []).some((photo) => photo?.status === 'approved' && photo?.url),
      ),
    [profiles],
  );

  const handleCompare = useCallback(
    (profile: SampleProfile) => {
      const approvedPhotos = (profile.photos ?? []).filter(
        (photo) => photo?.status === 'approved' && photo?.url,
      );
      const leftPhoto = approvedPhotos[0]?.url ?? null;
      const rightPhoto = approvedPhotos[1]?.url ?? approvedPhotos[0]?.url ?? null;

      navigation.navigate('Compare', {
        leftPhoto,
        rightPhoto,
        profile,
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={approvedProfiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            name={item.name}
            age={item.age}
            distanceMi={item.distanceMi}
            bio={item.bio}
            avatar={item.avatar}
            photo={item.photos.find((photo) => photo.status === 'approved')?.url}
            onCompare={() => handleCompare(item)}
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Explore nearby</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Matches' })}
              style={styles.matchesButton}
            >
              <Text style={styles.matchesLabel}>View matches →</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpacing} />}
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
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  matchesButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  matchesLabel: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  footerSpacing: {
    height: 32,
  },
});
