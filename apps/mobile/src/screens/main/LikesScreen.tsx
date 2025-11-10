import React, { useMemo, useState, useCallback } from 'react';
import { SectionList, StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useLikesQuery } from '../../features/likes/hooks';
import { Avatar, GlowBadge, Text, Button } from '@us/ui';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { LikeGroup } from '../../features/likes/utils';

type LikeSection = {
  title: string;
  key: 'big' | 'normal';
  data: LikeGroup[];
};

const MAX_INLINE_THUMBS = 3;

export const LikesScreen: React.FC = () => {
  const { data, isLoading } = useLikesQuery();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groups = data ?? { big: [], normal: [] };

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

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

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.kind}-${item.fromUser}`}
      contentContainerStyle={sections.length ? styles.list : [styles.list, styles.emptyContainer]}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text weight="bold" style={styles.sectionTitle}>
            {section.title}
          </Text>
          {section.key === 'big' && <GlowBadge label="Pinned" />}
        </View>
      )}
      renderItem={({ item }) => {
        const key = `${item.kind}-${item.fromUser}`;
        const isExpanded = expandedGroups.has(key);
        const name = item.profile?.display_name ?? 'Mystery user';
        const countText = item.count === 1 ? 'liked your post' : `liked ${item.count} of your posts`;
        const thumbnails = item.hearts.slice(0, MAX_INLINE_THUMBS);

        return (
          <View style={styles.groupContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Expand likes from ${name}`}
              onPress={() => toggleGroup(key)}
              style={styles.groupRow}
            >
              <Avatar uri={item.profile?.photo_urls?.[0]} label={name} size={56} />
              <View style={styles.groupContent}>
                <Text weight="semibold">{name}</Text>
                <Text muted>{countText}</Text>
                <Text muted style={styles.timestamp}>{new Date(item.latestAt).toLocaleString()}</Text>
                <View style={styles.thumbRow}>
                  {thumbnails.map((heart) => (
                    heart.post?.photo_url ? (
                      <Image
                        key={heart.id}
                        source={{ uri: heart.post.photo_url ?? '' }}
                        style={styles.thumbnail}
                        contentFit="cover"
                      />
                    ) : (
                      <View key={heart.id} style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
                    )
                  ))}
                  {item.count > MAX_INLINE_THUMBS && (
                    <Text muted style={styles.moreCount}>
                      +{item.count - MAX_INLINE_THUMBS}
                    </Text>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#8E8E93"
              />
            </Pressable>
            {isExpanded && (
              <View style={styles.detailList}>
                {item.hearts.map((heart) => {
                  const photo = heart.post?.photo_url;
                  return (
                    <View key={heart.id} style={styles.detailRow}>
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.detailImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.detailImage, styles.thumbnailPlaceholder]} />
                      )}
                      <View style={styles.detailInfo}>
                        <Text muted>{new Date(heart.created_at).toLocaleString()}</Text>
                      </View>
                      <Button
                        variant="secondary"
                        label="View"
                        onPress={() => navigation.navigate('ProfileDetail', { userId: item.fromUser })}
                        style={styles.detailButton}
                      />
                      <Button label="Us Photo" onPress={() => navigation.navigate('Compose')} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        !isLoading ? <Text muted style={styles.empty}>No likes yet—explore the feed!</Text> : null
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
  },
  groupContainer: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupContent: {
    flex: 1,
    gap: 4,
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
    backgroundColor: '#f0f0f0',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#E4E1F0',
  },
  moreCount: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  detailList: {
    marginTop: 12,
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
    backgroundColor: '#f8f8f8',
  },
  detailInfo: {
    flex: 1,
  },
  detailButton: {
    minWidth: 72,
  },
  empty: {
    textAlign: 'center',
    marginTop: 80,
  },
});
