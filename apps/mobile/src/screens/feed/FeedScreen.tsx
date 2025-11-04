import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import { useSampleProfiles } from '../../hooks/useSampleData';
import type { SampleProfile } from '../../data/sampleProfiles';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { useUserPostsStore } from '../../state/userPostsStore';
import { useAppTheme, type AppPalette } from '../../theme/palette';

type FeedItem = {
  id: string;
  userId: string;
  name: string;
  age: number;
  distanceMi?: number;
  bio: string;
  avatar: string;
  photo?: string;
  createdAt: number;
};

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
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
      color: palette.textPrimary,
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      marginTop: 6,
      color: palette.muted,
    },
    footerSpacing: {
      height: 32,
    },
  });

export default function FeedScreen() {
  const profiles = useSampleProfiles();
  const userPosts = useUserPostsStore((state) => state.posts);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
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

  const feedItems = useMemo(() => {
    const sampleItems: FeedItem[] = approvedProfiles.map((profile, index) => ({
      id: `sample-${profile.id}-${index}`,
      userId: profile.id,
      name: profile.name,
      age: profile.age,
      distanceMi: profile.distanceMi,
      bio: profile.bio,
      avatar: profile.avatar,
      photo: profile.photos.find((photo) => photo.status === 'approved')?.url,
      createdAt: Date.now() - (index + 1) * 1000,
    }));

    const authoredPosts: FeedItem[] = userPosts.map((post) => ({
      id: `user-${post.id}`,
      userId: post.userId,
      name: post.name,
      age: post.age ?? 0,
      distanceMi: undefined,
      bio: post.bio ?? 'Shared a new moment',
      avatar: post.avatar ?? '',
      photo: post.photoUrl,
      createdAt: post.createdAt,
    }));

    return [...authoredPosts, ...sampleItems].sort((a, b) => b.createdAt - a.createdAt);
  }, [approvedProfiles, userPosts]);

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
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            name={item.name}
            age={item.age}
            distanceMi={item.distanceMi}
            bio={item.bio}
            avatar={item.avatar}
            photo={item.photo}
            onCompare={() => {
              const profile = approvedProfiles.find((profile) => profile.id === item.userId);
              if (profile) {
                handleCompare(profile);
              }
            }}
            onOpenProfile={() => navigation.navigate('ProfileDetail', { userId: item.userId })}
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Explore nearby</Text>
            <Text style={styles.subtitle}>Tap a profile to open their full gallery.</Text>
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpacing} />}
      />
    </SafeAreaView>
  );
}
