import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native';
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
import { likeUser } from '../../api/likes';
import { useNavigation } from '@react-navigation/native';
import type { Gender } from '@us/types';
import { fetchLiveNow, type LiveNowItem } from '../../api/livePosts';
import SubscriptionCTA from '../../components/subscription/SubscriptionCTA';

type FeedProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  photo: string | null;
  gender: Gender | null;
};

type LiveCompareItem = {
  userId: string;
  livePostId: string;
  livePhotoUrl: string;
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
      gap: 8,
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
    subscriptionCtaWrapper: {
      marginTop: 4,
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

    // LIVE STRIP
    liveSection: {
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    liveLabel: {
      paddingHorizontal: 20,
      fontSize: 14,
      fontWeight: '600' as const,
      color: palette.accent,
      marginBottom: 8,
    },
    liveStrip: {
      paddingHorizontal: 16,
    },
    liveCard: {
      width: 180,
      marginRight: 16,
    },
    liveImageWrapper: {
      width: '100%',
      height: 220,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: palette.accent,
      backgroundColor: palette.background,
    },
    livePhoto: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    liveBadge: {
      position: 'absolute' as const,
      bottom: 4,
      left: 4,
      backgroundColor: '#ef4444',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    liveBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700' as const,
    },
    liveName: {
      fontSize: 12,
      color: palette.textPrimary,
      maxWidth: 96,
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

    const [error, setError] = useState<string | null>(null);

  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(new Set());
  const [liveNow, setLiveNow] = useState<LiveNowItem[]>([]);

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

  const liveCompareItems = useMemo<LiveCompareItem[]>(
    () =>
      liveNow.map((item) => ({
        userId: item.user_id,
        livePostId: item.id,
        livePhotoUrl: item.photo_url,
      })),
    [liveNow],
  );

  // Exclude any photos that are currently live from the main feed
  const visibleProfiles = useMemo(() => {
    if (!liveNow.length) return filteredProfiles;
    const livePhotos = new Set(liveNow.map((item) => item.photo_url));
    return filteredProfiles.filter((p) => !p.photo || !livePhotos.has(p.photo));
  }, [filteredProfiles, liveNow]);

  const feedCompareItems = useMemo(
    () => visibleProfiles.map((p) => ({ userId: p.id })),
    [visibleProfiles],
  );

  const loadLiveNow = useCallback(async () => {
    if (!isAuthenticated || !session) {
      setLiveNow([]);
      return;
    }
    try {
      const items = await fetchLiveNow();
      setLiveNow(items);
    } catch (err) {
      console.error('Failed to load live now', err);
    }
  }, [isAuthenticated, session]);

  useEffect(() => {
    loadLiveNow().catch(() => undefined);
  }, [loadLiveNow]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refresh(), loadLiveNow()]);
    } catch {
      // ignore
    }
  }, [refresh, loadLiveNow]);

  const handleLike = useCallback(
  async (postId: string | null, toUserId: string) => {
    if (!session) {
      Alert.alert('Sign in required', 'Create an account to like profiles.');
      return;
    }
    if (!postId) {
      Alert.alert('Missing post', 'This post is no longer available.');
      return;
    }
    if (likedPostIds.has(postId) || likingPostIds.has(postId)) return;

    setLikingPostIds((prev) => new Set([...prev, postId]));
    try {
      console.log('❤️ handleLike', { postId, toUserId });
      console.log('📸 Like pressed');
      if (!postId || postId === 'undefined') { console.warn('⚠️ Skipping like: invalid postId', postId); return; }
      await likeUser(session.user.id, toUserId, { postId });
      setLikedPostIds((prev) => new Set([...prev, postId]));
      show('Like sent!');
    } catch (err) {
      console.error(err);
      Alert.alert('Unable to like', 'Please try again in a moment.');
    } finally {
      setLikingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  },
  [session, likedPostIds, likingPostIds, show],
);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={visibleProfiles}
        keyExtractor={(item, index) => `${item.postId ?? index}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={!!refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            {liveNow.length ? (
              <View style={styles.liveSection}>
                <Text style={styles.liveLabel}>Live now (1 hour)</Text>
                <FlatList
                  data={liveNow}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.liveStrip}
                  renderItem={({ item, index }) => (
                    <Pressable
                      style={styles.liveCard}
                      onPress={() =>
                        navigation.navigate('Compare', {
                          profile: {
                            id: item.user_id,
                            name: item.profile?.name ?? undefined,
                            bio: item.profile?.bio ?? undefined,
                          },
                          leftPhoto: item.photo_url,
                          context: {
                            type: 'live',
                            index,
                            items: liveCompareItems,
                          },
                        })
                      }
                    >
                      <View style={styles.liveImageWrapper}>
                        <Image source={{ uri: item.photo_url }} style={styles.livePhoto} />
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveBadgeText}>LIVE</Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} style={styles.liveName}>
                        {item.profile?.name ?? 'Member'}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            ) : null}

            <View style={styles.header}>
              <Text style={styles.title}>Explore nearby</Text>
              <Text style={styles.subtitle}>
                Only approved photos appear here so you can browse safely.
              </Text>
              <View style={styles.subscriptionCtaWrapper}>
                <SubscriptionCTA location="feed" />
              </View>
            </View>
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
            visibleProfiles.length ? (
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
            bio={item.caption ?? item.bio}
            avatar={item.avatar ?? item.photo}
            photo={item.photo}
            onLike={() => handleLike(item.postId ?? null, item.id)}
            liked={likedPostIds.has(item.postId ?? '')}
            liking={likingPostIds.has(item.postId ?? '')}
            onCompare={() =>
              navigation.navigate('Compare', {
                profile: {
                  id: item.id,
                  name: item.name ?? undefined,
                  bio: item.bio ?? undefined,
                },
                leftPhoto: item.photo ?? null,
                context: {
                  type: 'feed',
                  index,
                  items: feedCompareItems,
                },
              })
            }
            onOpenProfile={() => navigation.navigate('ProfileDetail', { userId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}
