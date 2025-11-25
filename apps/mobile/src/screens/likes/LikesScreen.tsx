import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { selectIsAuthenticated, selectSession, useAuthStore } from '../../state/authStore';
import { fetchLikes } from '../../features/profile/api';
import { groupLikesByUser, type LikeGroup, type LikeGroupsByKind } from '../../features/likes/utils';
import { useToast } from '../../providers/ToastProvider';

const MAX_INLINE_THUMBS = 3;

type LikeSection = {
  title: string;
  key: 'big' | 'normal';
  data: LikeGroup[];
};

type LikesNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Likes'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function LikesScreen() {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const navigation = useNavigation<LikesNavigation>();
  const session = useAuthStore(selectSession);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { show } = useToast();
  const [groups, setGroups] = useState<LikeGroupsByKind>({ big: [], normal: [] });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLikes = useCallback(async () => {
    if (!session) {
      setGroups({ big: [], normal: [] });
      return;
    }
    setLoading(true);
    try {
      const likes = await fetchLikes(session.user.id);
      setGroups(groupLikesByUser(likes));
    } catch (err) {
      console.error('Likes load failed', err);
      show('Unable to load your likes right now.');
    } finally {
      setLoading(false);
    }
  }, [session, show]);

  const refreshLikes = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      const likes = await fetchLikes(session.user.id);
      setGroups(groupLikesByUser(likes));
    } catch (err) {
      console.error('Likes refresh failed', err);
      show('Unable to refresh likes. Please try again soon.');
    } finally {
      setRefreshing(false);
    }
  }, [session, show]);

  useEffect(() => {
    if (!session || !isAuthenticated) {
      setGroups({ big: [], normal: [] });
      return;
    }
    loadLikes();
  }, [session, isAuthenticated, loadLikes]);

  const sections = useMemo<LikeSection[]>(() => {
    const list: LikeSection[] = [];
    if (groups.big.length) {
      list.push({ title: 'Big Hearts ✨', key: 'big', data: groups.big });
    }
    if (groups.normal.length) {
      list.push({ title: 'Hearts', key: 'normal', data: groups.normal });
    }
    return list;
  }, [groups.big, groups.normal]);

  const toggleGroup = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sign in to see your likes</Text>
          <Text style={styles.emptyCopy}>
            Hearts from the community will appear here after you create an account.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.kind}-${item.fromUser}`}
        contentContainerStyle={sections.length ? styles.list : [styles.list, styles.emptyList]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshLikes} />}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Likes</Text>
            <Text style={styles.subtitle}>Every profile that loved your photos shows up here.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.key === 'big' ? <Text style={styles.sectionBadge}>Pinned</Text> : null}
          </View>
        )}
        renderItem={({ item }) => {
          const key = `${item.kind}-${item.fromUser}`;
          const isExpanded = expanded.has(key);
          const name = item.profile?.display_name ?? 'Member';
          const avatarUri = item.profile?.avatar_url ?? null;
          console.log('LIKES_AVATAR', avatarUri, item.profile);
          const countText = item.count === 1 ? 'liked your post' : `liked ${item.count} of your posts`;
          const thumbnails = item.hearts.slice(0, MAX_INLINE_THUMBS);

          return (
            <View style={styles.groupCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Expand likes from ${name}`}
                onPress={() => toggleGroup(key)}
                style={({ pressed }) => [styles.groupRow, pressed && styles.groupRowPressed]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarFallback}>{name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.groupContent}>
                  <Text style={styles.groupName}>{name}</Text>
                  <Text style={styles.groupCopy}>{countText}</Text>
                  <Text style={styles.groupTimestamp}>
                    {new Date(item.latestAt).toLocaleString()}
                  </Text>
                  <View style={styles.thumbRow}>
                    {thumbnails.map((heart) =>
                      heart.post?.photo_url ? (
                        <Image key={heart.id} source={{ uri: heart.post.photo_url }} style={styles.thumbnail} />
                      ) : (
                        <View key={heart.id} style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
                      ),
                    )}
                    {item.count > MAX_INLINE_THUMBS ? (
                      <Text style={styles.moreCount}>+{item.count - MAX_INLINE_THUMBS}</Text>
                    ) : null}
                  </View>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={palette.muted}
                />
              </Pressable>
              {isExpanded ? (
                <View style={styles.detailList}>
                  {item.hearts.map((heart) => (
                    <View key={heart.id} style={styles.detailRow}>
                      {heart.post?.photo_url ? (
                        <Image source={{ uri: heart.post.photo_url }} style={styles.detailImage} />
                      ) : (
                        <View style={[styles.detailImage, styles.thumbnailPlaceholder]} />
                      )}
                      <View style={styles.detailInfo}>
                        <Text style={styles.detailTimestamp}>
                          {new Date(heart.created_at).toLocaleString()}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => navigation.navigate('ProfileDetail', { userId: item.fromUser })}
                        style={({ pressed }) => [styles.detailButton, pressed && styles.detailButtonPressed]}
                      >
                        <Text style={styles.detailButtonLabel}>View profile</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color={palette.accent} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Keep posting, There's Someone for Everyone</Text>
              <Text style={styles.emptyCopy}>When someone hearts your photos, you’ll see them here.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    list: {
      paddingBottom: 32,
    },
    emptyList: {
      flexGrow: 1,
      paddingTop: 48,
      paddingBottom: 32,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    subtitle: {
      color: palette.muted,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    sectionBadge: {
      color: palette.accent,
      fontWeight: '700',
      fontSize: 12,
    },
    groupCard: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 18,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
    },
    groupRowPressed: {
      opacity: 0.85,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: palette.surface,
    },
    avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarFallback: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 18,
    },
    groupContent: {
      flex: 1,
      gap: 4,
    },
    groupName: {
      color: palette.textPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    groupCopy: {
      color: palette.textSecondary,
    },
    groupTimestamp: {
      color: palette.muted,
      fontSize: 12,
    },
    thumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    thumbnail: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: palette.surface,
    },
    thumbnailPlaceholder: {
      backgroundColor: palette.surface,
      opacity: 0.4,
    },
    moreCount: {
      color: palette.muted,
      fontWeight: '600',
    },
    detailList: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    detailImage: {
      width: 54,
      height: 54,
      borderRadius: 12,
      backgroundColor: palette.surface,
    },
    detailInfo: {
      flex: 1,
    },
    detailTimestamp: {
      color: palette.muted,
      fontSize: 12,
    },
    detailButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: palette.accent,
    },
    detailButtonPressed: {
      opacity: 0.9,
    },
    detailButtonLabel: {
      color: '#fff',
      fontWeight: '600',
    },
    loader: {
      marginTop: 64,
    },
    emptyState: {
      paddingHorizontal: 32,
      alignItems: 'flex-start',
      gap: 8,
      width: '100%',
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '600',
    },
    emptyCopy: {
      color: palette.muted,
      textAlign: 'left',
      lineHeight: 20,
    },
  });
