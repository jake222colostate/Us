import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, IconButton } from '@us/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import type { FeedPost } from '../api';
import { likePost, unlikePost } from '../../../api/postLikes';
import { likeUser } from '../../../api/likes';

export type FeedCardProps = {
  post: FeedPost;
  distanceText?: string;
  onOpenProfile: (userId: string) => void;
};

export const FeedCard: React.FC<FeedCardProps> = ({ post, distanceText, onOpenProfile }) => {
  const { session } = useAuth();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const { width, height } = useWindowDimensions();

  const [liked, setLiked] = useState(Boolean(post.liked_by_viewer));
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);

  useEffect(() => {
    setLiked(Boolean(post.liked_by_viewer));
    setLikeCount(post.like_count ?? 0);
  }, [post.id, post.liked_by_viewer, post.like_count]);

  const layout = useMemo(() => {
    const isDesktop = width >= 960;
    const horizontalPadding = isDesktop ? 0 : 24;
    const safeWidth = Math.max(320, width - horizontalPadding * 2);
    const availableHeight = Math.max(520, height - 160);
    let cardWidth = isDesktop ? Math.min(width * 0.4, 520) : safeWidth;
    let cardHeight = cardWidth * (16 / 9);

    if (cardHeight > availableHeight) {
      cardHeight = availableHeight;
      cardWidth = cardHeight * (9 / 16);
    }

    if (cardWidth > safeWidth) {
      cardWidth = safeWidth;
      cardHeight = cardWidth * (16 / 9);
    }

    return {
      wrapper: {
        paddingVertical: isDesktop ? 32 : 16,
      },
      card: {
        width: cardWidth,
        height: cardHeight,
      },
    } as const;
  }, [width, height]);

  const caption = useMemo(() => post.caption ?? 'Tap to see more', [post.caption]);

  const mutation = useMutation<void, unknown, boolean, { liked: boolean; likeCount: number }>({
    mutationFn: async (nextLiked: boolean) => {
      if (!session) {
        throw new Error('Sign in to like posts.');
      }
      if (nextLiked) {
        await likePost({ postId: post.id, fromUserId: session.user.id, toUserId: post.user_id });
        // also send a profile-level like to this user (best-effort)
        likeUser(session.user.id, post.user_id).catch(() => undefined);
      } else {
        await unlikePost({ postId: post.id, fromUserId: session.user.id });
      }
    },
    onMutate: async (nextLiked: boolean) => {
      const previous = { liked, likeCount };
      setLiked(nextLiked);
      setLikeCount((current) => {
        const delta = nextLiked ? 1 : -1;
        const next = current + delta;
        return next < 0 ? 0 : next;
      });
      return previous;
    },
    onError: (error, _nextLiked, context) => {
      setLiked(context?.liked ?? false);
      setLikeCount(context?.likeCount ?? 0);
      if (error instanceof Error) {
        show(error.message);
      } else {
        show('Unable to update like. Please try again.');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] }).catch(() => undefined);
    },
  });

  const toggleLike = () => {
    if (!session) {
      show('Sign in to like posts.');
      return;
    }
    mutation.mutate(!liked);
  };

  const likeIconName = liked ? 'heart' : 'heart-outline';
  const likeIconColor = liked ? '#FF4F8B' : '#ffffff';

  return (
    <View style={[styles.wrapper, layout.wrapper]}>
      <View style={[styles.container, layout.card]}>
        <Image
          source={{ uri: post.photo_url ?? '' }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
          style={styles.overlay}
          locations={[0, 0.45, 1]}
        />
        <View style={styles.overlayContent}>
          <View style={styles.topRow}><View style={styles.avatarWrapper}><Image source={{ uri: post.avatar ?? "" }} style={styles.avatar} /></View>
      {post.avatar ? (
            <Image source={{ uri: post.avatar }} style={styles.avatar} />
          ) : null}
            {distanceText ? (
              <View style={styles.distancePill} accessibilityRole="text">
                <Text weight="semibold" style={styles.distanceText}>
                  {distanceText}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.bottomRow}>
            <Pressable style={styles.metaBlock} onPress={() => onOpenProfile(post.user_id)}><Image source={{ uri: post.avatar }} style={styles.avatar} />
              <Text weight="bold" style={styles.name} numberOfLines={1}>
                {post.name ?? "Someone new" ?? 'Someone new'}
              </Text>
              <Text style={styles.caption} numberOfLines={3}>
                {caption}
              </Text>
            </Pressable>
            <View style={styles.actionRail}>
              <View style={styles.likeCluster}>
                <IconButton
                  accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
                  icon={<MaterialCommunityIcons name={likeIconName} size={28} color={likeIconColor} />}
                  onPress={toggleLike}
                  disabled={mutation.isPending}
                  style={styles.actionButton}
                />
                <Text style={styles.likeCount}>{likeCount}</Text>
              </View>
              <IconButton
                accessibilityLabel="View profile"
                icon={<MaterialCommunityIcons name="account-eye" size={26} color="#fff" />}
                onPress={() => onOpenProfile(post.user_id)}
                style={[styles.actionButton, styles.profileButton]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  wrapper: {
    alignItems: 'center',
  },
  container: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0d0d16',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  distancePill: {
    backgroundColor: 'rgba(9,9,15,0.68)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  distanceText: {
    color: '#f4f4ff',
    letterSpacing: 0.4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  metaBlock: {
    flex: 1,
    gap: 8,
  },
  name: {
    color: '#ffffff',
    fontSize: 20,
  },
  caption: {
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 20,
  },
  actionRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  likeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: 'rgba(15,15,30,0.6)',
    borderRadius: 16,
    width: 52,
    height: 52,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

