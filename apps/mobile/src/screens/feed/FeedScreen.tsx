import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  selectIsAuthenticated,
  selectIsInitialized,
} from '../../state/authStore';
import { useMatchesStore } from '../../state/matchesStore';
import { getSupabaseClient } from '../../api/supabase';
import { useToast } from '../../providers/ToastProvider';
import { fetchLiveNow, type LiveNowItem } from '../../api/livePosts';
import LiveCountdown from '../../components/LiveCountdown';

type FeedProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  photo: string | null;
  hasQuiz: boolean;
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
    liveSection: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },
    liveHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    liveHeader: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    liveScroll: {
      gap: 16,
    },
    liveCard: {
      width: 180,
      borderRadius: 18,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    },
    liveImageWrapper: {
      position: 'relative',
      width: '100%',
      aspectRatio: 3 / 4,
      backgroundColor: palette.surface,
    },
    liveImage: {
      width: '100%',
      height: '100%',
    },
    liveBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: '#ef4444',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    liveBadgeText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
    },
    liveCountdownPill: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(15,23,42,0.75)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    liveCountdownText: {
      color: '#fff',
      fontSize: 12,
    },
    liveBody: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 6,
    },
    liveName: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 16,
    },
    liveBio: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 18,
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
  const [liveItems, setLiveItems] = useState<LiveNowItem[]>([]);
  const { show } = useToast();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore(selectIsInitialized);

  const load = useCallback(async () => {
    if (!session || !isAuthenticated || !isInitialized) {
      setProfiles([]);
      setError(null);
      setLiveItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      try {
        const liveNow = await fetchLiveNow();
        setLiveItems(liveNow);
      } catch (liveError) {
        console.error('Failed to load live posts', liveError);
        setLiveItems([]);
      }
      const { data: profileRows, error: profileError } = await client
        .from('profiles')
        .select('id, display_name, bio')
        .neq('id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (profileError) throw profileError;
      const ids = (profileRows ?? []).map((row) => row.id);
      if (ids.length === 0) {
        setProfiles([]);
        return;
      }
      const { data: quizRows } = await client.from('quizzes').select('owner_id').in('owner_id', ids);
      const quizOwners = new Set<string>((quizRows ?? []).map((row) => row.owner_id as string));
      const { data: photosData, error: photosError } = await client
        .from('photos')
        .select('*')
        .in('user_id', ids)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
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
        const heroPhoto = photos.find((photo) => photo.status === 'approved' && photo.url);
        mappedProfiles.push({
          id: row.id,
          name: row.display_name,
          bio: row.bio,
          photo: heroPhoto?.url ?? null,
          hasQuiz: quizOwners.has(row.id),
        });
      }
      setProfiles(mappedProfiles);
    } catch (err) {
      console.error('Feed load failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      show(`Unable to load feed: ${message}`);
      setError(`Unable to load the feed from Supabase.`);
    } finally {
      setLoading(false);
    }
  }, [session, show, isAuthenticated, isInitialized]);

  useEffect(() => {
    if (!isAuthenticated || !session || !isInitialized) {
      setProfiles([]);
      setError(null);
      setLoading(false);
      return;
    }
    load();
  }, [load, isAuthenticated, session, isInitialized]);

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

  const liveSection = liveItems.length ? (
    <View style={styles.liveSection}>
      <View style={styles.liveHeaderRow}>
        <Text style={styles.liveHeader}>Live now</Text>
        <Text style={styles.subtitle}>{liveItems.length === 1 ? '1 person is live' : `${liveItems.length} people are live`}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveScroll}>
        {liveItems.map((item) => (
          <Pressable
            key={item.id}
            style={styles.liveCard}
            onPress={() => navigation.navigate('ProfileDetail', { userId: item.user_id })}
          >
            <View style={styles.liveImageWrapper}>
              <Image source={{ uri: item.photo_url }} style={styles.liveImage} resizeMode="cover" />
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
              <View style={styles.liveCountdownPill}>
                <LiveCountdown expiresAt={item.live_expires_at} style={styles.liveCountdownText} />
              </View>
            </View>
            <View style={styles.liveBody}>
              <Text style={styles.liveName}>{item.profile?.name ?? 'Member'}</Text>
              {item.profile?.bio ? (
                <Text style={styles.liveBio} numberOfLines={2}>
                  {item.profile.bio}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            name={item.name ?? 'Member'}
            bio={item.bio}
            avatar={item.photo}
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
            onQuiz={() => navigation.navigate('Quiz', { ownerId: item.id, ownerName: item.name ?? undefined })}
            hasQuiz={item.hasQuiz}
          />
        )}
        refreshControl={refreshControl}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {liveSection}
            <View style={styles.header}>
              <Text style={styles.title}>Explore nearby</Text>
              <Text style={styles.subtitle}>Only approved photos appear here so you can browse safely.</Text>
            </View>
          </>
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
