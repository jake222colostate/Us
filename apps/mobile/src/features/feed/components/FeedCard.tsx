import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, IconButton, GlowBadge } from '@us/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendBigHeart, sendFreeHeart } from '../api';
import type { Post } from '@us/types';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import { useBilling } from '../../../providers/BillingProvider';
import { useMutation } from '@tanstack/react-query';
import { BigHeartButton } from './BigHeartButton';

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

  const heartMutation = useMutation<void, unknown, { kind: 'normal' | 'big'; purchaseId?: string }>({
    mutationFn: async ({ kind, purchaseId }) => {
      if (!session) throw new Error('Sign in required');
      if (kind === 'normal') {
        await sendFreeHeart(post.id, post.user_id);
        return;
      }

      await sendBigHeart({
        postId: post.id,
        toUser: post.user_id,
        purchaseId,
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
            { text: 'Send Big Heart', onPress: () => onBigHeart() },
          ],
        );
        return;
      }
      show(error instanceof Error ? error.message : 'Unable to send heart');
    },
  });

  const onHeart = () => {
    Haptics.selectionAsync();
    heartMutation.mutate({ kind: 'normal' });
  };

  const onBigHeart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { purchaseId } = await beginBigHeartPurchase();
    heartMutation.mutate({ kind: 'big', purchaseId });
  };

  const caption = useMemo(() => post.caption ?? 'Tap to see more', [post.caption]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: post.photo_url }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
        locations={[0.45, 1]}
      />
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text weight="bold" style={styles.name}>
            {post.profile?.display_name ?? 'Someone new'}
          </Text>
          {distanceText && (
            <Text muted style={styles.distance}>
              {distanceText}
            </Text>
          )}
          <Text style={styles.caption}>{caption}</Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            accessibilityLabel="Send heart"
            icon={<MaterialCommunityIcons name="heart-outline" size={26} color="#FF4F8B" />}
            onPress={onHeart}
            disabled={freeHeartCapped || heartMutation.isPending}
          />
          <BigHeartButton onPress={onBigHeart} disabled={heartMutation.isPending} />
          <GlowBadge label={priceDisplay} />
        </View>
      </View>
      <View style={styles.touchZone} pointerEvents="box-none">
        <IconButton
          accessibilityLabel="View profile"
          icon={<MaterialCommunityIcons name="account-eye" size={26} color="#fff" />}
          onPress={() => onOpenProfile(post.user_id)}
          style={styles.profileButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
  },
  name: {
    color: '#fff',
    fontSize: 24,
  },
  distance: {
    color: '#fff',
  },
  caption: {
    color: '#fff',
    marginTop: 4,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  touchZone: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 16,
  },
  profileButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
