import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/Card';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { usePagedFeed } from '../../hooks/usePagedFeed';
import {
  useAuthStore,
  selectSession,
  selectIsAuthenticated,
  selectIsInitialized,
  selectCurrentUser,
} from '../../state/authStore';
import { useToast } from '../../providers/ToastProvider';
import { likePost } from '../../api/postLikes';
import { useNavigation } from '@react-navigation/native';
import type { Gender } from '@us/types';

type FeedProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  photo: string | null;
  hasQuiz: boolean;
  gender: Gender | null;
};

const createStyles = (palette: AppPalette) =>
  ({
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
      fontWeight: '700' as const,
    },
    subtitle: {
      marginTop: 6,
      color: palette.muted,
    },
    footerSpacing: { height: 32 },
    errorText: {
      color: palette.danger,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    emptyState: {
      paddingHorizontal: 20,
      paddingTop: 40,
      alignItems: 'center' as const,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: palette.textPrimary,
    },
    emptyCopy: {
      textAlign: 'center' as const,
      color: palette.muted,
    },
  } as const);

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const session = useAuthStore(selectSession);
  const currentUser = useAuthStore(selectCurrentUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore(selectIsInitialized);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { show } = useToast();

  const { profiles, loading, refreshing, loadMore, refresh, hasMore } =
    usePagedFeed(isAuthenticated && !!session);

  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const [likingUserIds, setLikingUserIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const genderPreference: 'everyone' | 'women' | 'men' | 'nonbinary' =
    (currentUser?.lookingFor as any) ?? 'everyone';

  const filteredProfiles = useMemo(() => {
    if (genderPreference === 'everyone') return profiles;
    return profiles.filter((p) => {
      if (!p.gender) return true;
      if (genderPreference === 'women') return p.gender === 'woman';
      if (genderPreference === 'men') return p.gender === 'man';
      if (genderPreference === 'nonbinary') return p.gender === 'nonbinary' || p.gender === 'other';
      return true;
    });
  }, [profiles, genderPreference]);

  const feedCompareItems = useMemo(
    () => filteredProfiles.map((p) => ({ userId: p.id })),
    [filteredProfiles],
  );

  const handleLike = useCallback(
    async (toUserId: string) => {
      if (!session) {
        Alert.alert('Sign in required', 'Create an account to like profiles.');
        return;
      }
      if (likedUserIds.has(toUserId) || likingUserIds.has(toUserId)) return;
      setLikingUserIds((prev) => new Set([...prev, toUserId]));
      try {
        // like the latest post for this user (API looks it up serverside)
        await likePost({
          postId: undefined as any, // API resolves latest on server or edge fn
          fromUserId: session.user.id,
          toUserId,
        });
        setLikedUserIds((prev) => new Set([...prev, toUserId]));
        show('Like sent!');
      } catch (err) {
        console.error(err);
        Alert.alert('Unable to like', 'Please try again in a moment.');
      } finally {
        setLikingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(toUserId);
          return next;
        });
      }
    },
    [session, likedUserIds, likingUserIds, show],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={filteredProfiles}
        keyExtractor={(item, index) => `${item.id}:${index}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={!!refreshing} onRefresh={refresh} />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Explore nearby</Text>
            <Text style={styles.subtitle}>
              Only approved photos appear here so you can browse safely.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore || loading ? (
            <Text style={{ textAlign: 'center', padding: 16 }}>Loading…</Text>
          ) : (
            <View style={styles.footerSpacing} />
          )
        }
        ListEmptyComponent={
          !loading ? (
            filteredProfiles.length ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No profiles match your preferences</Text>
                <Text style={styles.emptyCopy}>
                  Try adjusting your settings or check back later.
                </Text>
              </View>
            ) : null
          ) : null
        }
        renderItem={({ item, index }) => (
          <Card
            name={item.name ?? 'Member'}
            bio={item.bio}
            avatar={item.photo}
            photo={item.photo}
            onLike={() => handleLike(item.id)}
            liked={likedUserIds.has(item.id)}
            liking={likingUserIds.has(item.id)}
            onCompare={() =>
              navigation.navigate('Compare', {
                profile: {
                  id: item.id,
                  name: item.name ?? undefined,
                  bio: item.bio ?? undefined,
                },
                context: {
                  type: 'feed',
                  index,
                  items: feedCompareItems,
                },
              })
            }
            onOpenProfile={() => navigation.navigate('ProfileDetail', { userId: item.id })}
            onQuiz={() =>
              navigation.navigate('Quiz', {
                ownerId: item.id,
                ownerName: item.name ?? undefined,
              })
            }
            hasQuiz={item.hasQuiz}
          />
        )}
      />
    </SafeAreaView>
  );
}
