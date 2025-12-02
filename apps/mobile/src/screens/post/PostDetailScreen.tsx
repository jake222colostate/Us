import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { getPostLikeStatus } from '../../api/likes';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type PostDetailRoute = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const route = useRoute<PostDetailRoute>();
  const { postId, photoUrl, caption } = route.params ?? {};
  const [liked, setLiked] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!postId) return;
      setChecking(true);
      try {
        const likedNow = await getPostLikeStatus(postId);
        setLiked(likedNow);
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [postId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>Photo unavailable</Text>
          </View>
        )}

        <View style={styles.likeRow}>
          {checking ? (
            <ActivityIndicator color={palette.textPrimary} />
          ) : (
            <>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? palette.accent : palette.muted}
              />
              <Text style={styles.likeText}>
                {liked ? 'You liked this photo' : 'You have not liked this photo'}
              </Text>
            </>
          )}
        </View>

        {caption ? (
          <View style={styles.captionCard}>
            <Text numberOfLines={4} style={styles.captionLabel}>
              Caption
            </Text>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 20,
    },
    photo: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: 20,
      backgroundColor: palette.surface,
    },
    photoPlaceholder: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: 20,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoPlaceholderText: {
      color: palette.muted,
    },
    likeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    likeText: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },
    captionCard: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: palette.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      gap: 6,
    },
    captionLabel: {
      color: palette.muted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    captionText: {
      color: palette.textPrimary,
      fontSize: 15,
      lineHeight: 20,
    },
  });
}

export default PostDetailScreen;
