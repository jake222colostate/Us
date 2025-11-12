import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { listUserPosts, deletePost, type Post } from '../../api/posts';
import { getSupabaseClient } from '../../api/supabase';
import { isTableMissingError, logTableMissingWarning } from '../../api/postgrestErrors';
import { selectCurrentUser, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useToast } from '../../providers/ToastProvider';

const PLACEHOLDER_BIO = 'Share a short bio so matches know a little about you.';

export type ProfilePost = Post;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type DeletePayload = { postId: string; photoUrl?: string | null };

const keyExtractor = (item: ProfilePost) => item.id;

const ProfileScreen: React.FC = () => {
  const user = useAuthStore(selectCurrentUser);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const navigation = useNavigation<Navigation>();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const [removingPostIds, setRemovingPostIds] = useState<Set<string>>(new Set());

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch,
  } = useQuery({
    queryKey: ['profile-posts', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return [] as Post[];
      return listUserPosts(user.id);
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      refetch().catch(() => undefined);
    }, [refetch, user?.id]),
  );

  const posts = postsData ?? [];

  const { data: hasQuizData } = useQuery({
    queryKey: ['profile-has-quiz', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) return false;
      try {
        const client = getSupabaseClient();
        const { data: quizRow, error } = await client
          .from('quizzes')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          if (isTableMissingError(error, 'quizzes')) {
            logTableMissingWarning('quizzes', error);
            return false;
          }
          if ((error as { code?: string }).code === 'PGRST116') {
            return false;
          }
          throw error;
        }
        return Boolean(quizRow);
      } catch (err) {
        console.warn('Failed to check quiz availability', err);
        return false;
      }
    },
  });
  const hasQuiz = Boolean(hasQuizData);

  const deleteMutation = useMutation({
    mutationFn: async ({ postId, photoUrl }: DeletePayload) => {
      await deletePost({ postId, photoUrl });
    },
    onMutate: async ({ postId }) => {
      setRemovingPostIds((prev) => {
        const next = new Set(prev);
        next.add(postId);
        return next;
      });
    },
    onError: () => {
      show('Unable to remove this photo. Please try again.');
    },
    onSuccess: (_data, variables) => {
      const ownerId = user?.id;
      queryClient.setQueryData<Post[] | undefined>(['profile-posts', ownerId], (current) => {
        if (!current) return current;
        return current.filter((post) => post.id !== variables.postId);
      });
      queryClient.invalidateQueries({ queryKey: ['feed'] }).catch(() => undefined);
      show('Photo removed.');
    },
    onSettled: (_data, _error, variables) => {
      setRemovingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.postId);
        return next;
      });
    },
  });

  const displayName = user?.name?.trim() ? user.name.trim() : 'Your profile';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  const avatarUri = user?.avatar ?? posts[0]?.photo_url ?? null;
  const bioCopy = user?.bio?.trim().length ? user.bio.trim() : PLACEHOLDER_BIO;

  const handleDeletePost = useCallback(
    (post: ProfilePost) => {
      Alert.alert('Remove photo?', 'This will delete the photo from your profile and feed.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ postId: post.id, photoUrl: post.photo_url }),
        },
      ]);
    },
    [deleteMutation],
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator color={palette.textPrimary} />
        <Text style={styles.loadingLabel}>Loading your profile…</Text>
      </SafeAreaView>
    );
  }

  const renderPost = ({ item }: { item: ProfilePost }) => {
    const isRemoving = removingPostIds.has(item.id);
    return (
      <View style={[styles.photoItem, isRemoving && styles.photoItemRemoving]}>
        <Image source={{ uri: item.photo_url }} style={styles.photo} />
        <Pressable
          accessibilityLabel="Delete photo"
          accessibilityRole="button"
          style={({ pressed }) => [styles.photoDeleteButton, pressed && styles.photoDeleteButtonPressed]}
          onPress={() => handleDeletePost(item)}
          disabled={isRemoving}
        >
          {isRemoving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.photoDeleteIcon}>×</Text>}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{initials || '😊'}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.displayName}>{displayName}</Text>
            {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        </View>

        <Text style={styles.bio}>{bioCopy}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.primaryButtonLabel}>Edit Profile</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('MyQuizBuilder')}
          >
            <Text style={styles.secondaryButtonLabel}>Edit Quiz</Text>
          </Pressable>
        </View>

        {hasQuiz ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.quizButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('Quiz', { ownerId: user.id })}
          >
            <Text style={styles.quizButtonLabel}>🧠 Take my quiz</Text>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {isLoadingPosts ? (
            <ActivityIndicator color={palette.textPrimary} style={styles.photosLoader} />
          ) : posts.length ? (
            <FlatList
              data={posts}
              keyExtractor={keyExtractor}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.photoRow}
              renderItem={renderPost}
              ListFooterComponent={<View style={styles.photoFooterSpacer} />}
            />
          ) : (
            <Text style={styles.placeholderText}>Add a photo to start building your gallery.</Text>
          )}
        </View>
      </ScrollView>
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
      paddingHorizontal: 20,
      paddingVertical: 24,
      gap: 20,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      gap: 12,
    },
    loadingLabel: {
      color: palette.textSecondary,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarPlaceholderText: {
      color: palette.muted,
      fontSize: 24,
      fontWeight: '700',
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    displayName: {
      color: palette.textPrimary,
      fontSize: 24,
      fontWeight: '700',
    },
    email: {
      color: palette.textSecondary,
    },
    bio: {
      color: palette.textSecondary,
      lineHeight: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quizButton: {
      alignSelf: 'stretch',
      backgroundColor: palette.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.accent,
      paddingVertical: 14,
      alignItems: 'center',
    },
    quizButtonLabel: {
      color: palette.accent,
      fontWeight: '700',
    },
    primaryButton: {
      flex: 1,
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
    },
    secondaryButtonLabel: {
      color: palette.accent,
      fontWeight: '700',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    section: {
      gap: 16,
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    photosLoader: {
      paddingVertical: 12,
    },
    photoRow: {
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    photoItem: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: palette.surface,
    },
    photoItemRemoving: {
      opacity: 0.6,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    photoDeleteButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(15,23,42,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoDeleteButtonPressed: {
      opacity: 0.8,
    },
    photoDeleteIcon: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 16,
    },
    photoFooterSpacer: {
      height: 8,
    },
    placeholderText: {
      color: palette.muted,
      fontStyle: 'italic',
    },
  });
}

export default ProfileScreen;
