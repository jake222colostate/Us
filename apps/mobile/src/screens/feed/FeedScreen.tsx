import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { mapPhotoRows, type PhotoRow } from '../../lib/photos';
import { likeUser } from '../../api/likes';
import {
  useAuthStore,
  selectSession,
} from '../../state/authStore';
import { useMatchesStore } from '../../state/matchesStore';
import { getSupabaseClient } from '../../api/supabase';

const calculateAge = (birthday: string | null): number | null => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
};

type FeedProfile = {
  id: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  avatar: string | null;
  photo: string | null;
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
    errorText: {
      color: palette.danger,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    emptyState: {
      paddingHorizontal: 20,
      paddingTop: 40,
      alignItems: 'center',
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    emptyCopy: {
      textAlign: 'center',
      color: palette.muted,
    },
  });

export default function FeedScreen() {
  const session = useAuthStore(selectSession);
  const fetchMatches = useMatchesStore((state) => state.fetchMatches);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Feed'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [profiles, setProfiles] = useState<FeedProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setProfiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      const { data: profileRows, error: profileError } = await client
        .from('profiles')
        .select('id, display_name, bio, avatar_url, birthday')
        .neq('id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (profileError) throw profileError;
      const ids = (profileRows ?? []).map((row) => row.id);
      if (ids.length === 0) {
        setProfiles([]);
        return;
      }
      const { data: photosData, error: photosError } = await client
        .from('photos')
        .select('*')
        .in('user_id', ids)
        .eq('status', 'approved');
      if (photosError) throw photosError;
      const photosByUser = new Map<string, PhotoRow[]>();
      (photosData as PhotoRow[] | null)?.forEach((row) => {
        const list = photosByUser.get(row.user_id) ?? [];
        list.push(row);
        photosByUser.set(row.user_id, list);
      });
      const mappedProfiles: FeedProfile[] = [];
      for (const row of profileRows ?? []) {
        const photoRows = photosByUser.get(row.id) ?? [];
        const photos = await mapPhotoRows(photoRows);
        const heroPhoto = photos.find((photo) => photo.status === 'approved');
        mappedProfiles.push({
          id: row.id,
          name: row.display_name,
          age: calculateAge(row.birthday ?? null),
          bio: row.bio,
          avatar: row.avatar_url ?? heroPhoto?.url ?? null,
          photo: heroPhoto?.url ?? null,
        });
      }
      setProfiles(mappedProfiles);
    } catch (err) {
      console.error(err);
      setError('Unable to load the feed from Supabase.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLike = useCallback(
    async (targetId: string) => {
      if (!session) {
        Alert.alert('Sign in required', 'Create an account to like profiles.');
        return;
      }
      try {
        const result = await likeUser(session.user.id, targetId);
        if (result.matchCreated) {
          await fetchMatches(session.user.id);
          Alert.alert('It’s a match!', 'You both liked each other. Check your matches tab.');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Unable to like', 'Please try again in a moment.');
      }
    },
    [session, fetchMatches],
  );

  const refreshControl = (
    <RefreshControl
      refreshing={loading}
      onRefresh={load}
      tintColor="#a855f7"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            name={item.name ?? 'Member'}
            age={item.age}
            bio={item.bio}
            avatar={item.avatar}
            photo={item.photo}
            onLike={() => handleLike(item.id)}
            onCompare={() =>
              navigation.navigate('Compare', {
                profile: {
                  id: item.id,
                  name: item.name ?? undefined,
                  bio: item.bio ?? undefined,
                },
              })
            }
            onOpenProfile={() => navigation.navigate('ProfileDetail', { userId: item.id })}
          />
        )}
        refreshControl={refreshControl}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Explore nearby</Text>
            <Text style={styles.subtitle}>Only approved photos appear here so you can browse safely.</Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No profiles yet</Text>
              <Text style={styles.emptyCopy}>
                We’ll surface people once they add approved photos. Try again shortly.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={<View style={styles.footerSpacing} />}
      />
    </SafeAreaView>
  );
}
