import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, IconButton, GlowBadge } from '@us/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendBigHeart, sendFreeHeart, uploadHeartSelfie, type HeartSelfieUpload } from '../api';
import type { Post } from '@us/types';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import { useBilling } from '../../../providers/BillingProvider';
import { useMutation } from '@tanstack/react-query';
import { BigHeartButton } from './BigHeartButton';
import { HeartComposer, type HeartComposerPayload } from './HeartComposer';

export type FeedCardProps = {
  post: Post;
  distanceText?: string;
  onOpenProfile: (userId: string) => void;
};

export const FeedCard: React.FC<FeedCardProps> = ({ post, distanceText, onOpenProfile }) => {
  const { session } = useAuth();
  const { show } = useToast();
  const { beginBigHeartPurchase, priceDisplay } = useBilling();
  const [freeHeartCapped, setFreeHeartCapped] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
  const [pendingKind, setPendingKind] = useState<'normal' | 'big' | null>(null);
  const { width, height } = useWindowDimensions();

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
    };
  }, [width, height]);

  const openComposer = (kind: 'normal' | 'big') => {
    setPendingKind(kind);
    setComposerVisible(true);
  };

  const heartMutation = useMutation<
    void,
    unknown,
    | { kind: 'normal'; message?: string; selfie?: HeartSelfieUpload }
    | { kind: 'big'; purchaseId?: string; message?: string; selfie?: HeartSelfieUpload }
  >({
    mutationFn: async ({ kind, purchaseId, message, selfie }) => {
      if (!session) throw new Error('Sign in required');
      let selfieUrl: string | undefined;
      if (selfie) {
        selfieUrl = await uploadHeartSelfie(session.user.id, selfie);
      }
      if (kind === 'normal') {
        const hasExtras = Boolean(message) || Boolean(selfieUrl);
        await sendFreeHeart(
          post.id,
          post.user_id,
          hasExtras ? { message, selfieUrl } : undefined,
        );
        return;
      }

      await sendBigHeart({
        postId: post.id,
        toUser: post.user_id,
        purchaseId,
        message,
        selfieUrl,
      });
    },
    onSuccess: (_, variables) => {
      if (variables?.kind === 'normal') {
        setFreeHeartCapped(false);
        show('Sent with love ❤️');
      } else {
        show('Big Heart sent ✨');
      }
    },
    onError: (error: unknown, variables) => {
      if (variables?.kind === 'normal' && error instanceof Error && error.message === 'FREE_HEART_LIMIT_REACHED') {
        setFreeHeartCapped(true);
        Alert.alert(
          'Daily limit reached',
          'You’ve used all 125 free hearts for today. Send a Big Heart ✨ to stand out.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Send Big Heart', onPress: () => openComposer('big') },
          ],
        );
        return;
      }
      show(error instanceof Error ? error.message : 'Unable to send heart');
    },
  });

  const onHeart = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    openComposer('normal');
  };

  const onBigHeart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    openComposer('big');
  };

  const caption = useMemo(() => post.caption ?? 'Tap to see more', [post.caption]);

  const handleComposerClose = () => {
    setComposerVisible(false);
    setPendingKind(null);
  };

  const handleComposerSubmit = async ({ message, selfie }: HeartComposerPayload) => {
    if (!pendingKind) return;
    if (pendingKind === 'normal') {
      heartMutation.mutate({ kind: 'normal', message, selfie });
      handleComposerClose();
      return;
    }
    try {
      const { purchaseId } = await beginBigHeartPurchase();
      heartMutation.mutate({ kind: 'big', purchaseId, message, selfie });
    } catch (error) {
      show(error instanceof Error ? error.message : 'Unable to start Big Heart purchase');
    } finally {
      handleComposerClose();
    }
  };

  return (
    <View style={[styles.wrapper, layout.wrapper]}>
      <View style={[styles.container, layout.card]}>
      <Image
        source={{ uri: post.photo_url }}
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
        <View style={styles.topRow}>
          {distanceText ? (
            <View style={styles.distancePill} accessibilityRole="text">
              <Text weight="semibold" style={styles.distanceText}>
                {distanceText}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.metaBlock}>
            <Text weight="bold" style={styles.name} numberOfLines={1}>
              {post.profile?.display_name ?? 'Someone new'}
            </Text>
            <Text style={styles.caption} numberOfLines={3}>
              {caption}
            </Text>
          </View>
          <View style={styles.actionRail}>
            <IconButton
              accessibilityLabel="Send heart"
              icon={<MaterialCommunityIcons name="heart-outline" size={28} color="#FF4F8B" />}
              onPress={onHeart}
              disabled={freeHeartCapped || heartMutation.isPending}
              style={styles.actionButton}
            />
            <BigHeartButton onPress={onBigHeart} disabled={heartMutation.isPending} />
            <View style={styles.badgeWrapper}>
              <GlowBadge label={priceDisplay} />
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
      <HeartComposer
        visible={composerVisible}
        kind={pendingKind ?? 'normal'}
        onClose={handleComposerClose}
        onSubmit={handleComposerSubmit}
        post={post}
        isSending={heartMutation.isPending}
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#04040A',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 12,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  distancePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  distanceText: {
    color: '#F5F5F5',
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  metaBlock: {
    flex: 1,
    gap: 8,
  },
  name: {
    color: '#fff',
    fontSize: 26,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 3 },
  },
  caption: {
    color: '#fff',
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.95,
  },
  actionRail: {
    gap: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  badgeWrapper: {
    marginVertical: 4,
  },
  actionButton: {
    backgroundColor: 'rgba(5,5,10,0.8)',
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
