import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { useComparePreferences, type CompareLayout } from '../../state/comparePreferences';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { mapPhotoRows, type PhotoRow } from '../../lib/photos';
import { getSupabaseClient } from '../../api/supabase';
import { listUserPosts, type Post } from '../../api/posts';
import { likeUser } from '../../api/likes';
import { selectCurrentUser, selectSession, useAuthStore } from '../../state/authStore';
import { useToast } from '../../providers/ToastProvider';

const layoutOptions: { key: CompareLayout; label: string }[] = [
  { key: 'horizontal', label: 'Side by side' },
  { key: 'vertical', label: 'Vertical' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

export default function CompareScreen({ route, navigation }: Props) {
  const { layout, setLayout } = useComparePreferences();
  const params = route.params ?? {};
  const [approvedPhotos, setApprovedPhotos] = useState<string[]>([]);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [rightPhoto, setRightPhoto] = useState<string | null>(() => params.rightPhoto ?? null);
  const [rightPhotoSource, setRightPhotoSource] = useState<'camera' | 'library' | 'post' | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isPostPickerVisible, setIsPostPickerVisible] = useState(false);
  const [isSendingLike, setIsSendingLike] = useState(false);
  const session = useAuthStore(selectSession);
  const currentUser = useAuthStore(selectCurrentUser);
  const { show } = useToast();

  useEffect(() => {
    setRightPhoto(params.rightPhoto ?? null);
    setRightPhotoSource(null);
    setSelectedPostId(null);
  }, [params.profile?.id, params.rightPhoto]);

  const viewerPostsQuery = useQuery({
    queryKey: ['compare-viewer-posts', currentUser?.id],
    enabled: Boolean(currentUser?.id),
    queryFn: async () => {
      if (!currentUser?.id) return [] as Post[];
      try {
        return await listUserPosts(currentUser.id, 50);
      } catch (err) {
        console.warn('Failed to load viewer posts for comparison', err);
        return [] as Post[];
      }
    },
  });

  const viewerPostOptions = useMemo(
    () =>
      (viewerPostsQuery.data ?? [])
        .map((post) => ({ id: post.id, uri: post.photo_url }))
        .filter((item): item is { id: string; uri: string } => Boolean(item.id) && Boolean(item.uri)),
    [viewerPostsQuery.data],
  );

  useEffect(() => {
    const loadPhotos = async () => {
      if (!params.profile?.id) {
        setApprovedPhotos([]);
        return;
      }
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('photos')
          .select('*')
          .eq('user_id', params.profile.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const rows = (data ?? []) as PhotoRow[];
        const signed = await mapPhotoRows(rows);
        setApprovedPhotos(signed.map((photo) => photo.url).filter((url): url is string => Boolean(url)));
      } catch (err) {
        console.error('Failed to load comparison photos', err);
        setApprovedPhotos([]);
      }
    };
    loadPhotos();
  }, [params.profile?.id]);

  const handleNextProfile = useCallback(async () => {
    const context = params.context;
    if (!context || !context.items?.length) {
      navigation.goBack();
      return;
    }

    const nextIndex = (context.index + 1) % context.items.length;
    const target = context.items[nextIndex];
    if (!target) {
      navigation.goBack();
      return;
    }

    setIsLoadingNext(true);
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name, bio, verification_status')
        .eq('id', target.userId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const row = data ?? null;
      const nextProfile = row
        ? {
            id: (row.id as string) ?? target.userId,
            name: (row.display_name as string | null) ?? undefined,
            bio: (row.bio as string | null) ?? undefined,
            verification: {
              status: (row.verification_status as string | null) ?? null,
            },
          }
        : { id: target.userId };

      let nextLeftPhoto: string | null = null;
      if (context.type === 'live') {
        const liveTarget = context.items[nextIndex];
        nextLeftPhoto = liveTarget?.livePhotoUrl ?? null;
        if (!nextLeftPhoto) {
          const { data: liveData, error: liveError } = await client
            .from('live_posts')
            .select('photo_url')
            .eq('user_id', target.userId)
            .order('live_started_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!liveError) {
            nextLeftPhoto = (liveData?.photo_url as string | null) ?? null;
          }
        }
      }

      setApprovedPhotos([]);
      navigation.setParams({
        profile: nextProfile,
        leftPhoto: nextLeftPhoto ?? null,
        rightPhoto: null,
        context: { ...context, index: nextIndex },
      });
      setRightPhoto(null);
      setRightPhotoSource(null);
      setSelectedPostId(null);
    } catch (err) {
      console.error('Failed to load next profile for comparison', err);
      Alert.alert('Unable to load profile', 'Please try again in a moment.');
    } finally {
      setIsLoadingNext(false);
    }
  }, [navigation, params.context]);

  const providedPhotos = useMemo(() => {
    const items = params.profile?.photos;
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((photo) => photo?.status === 'approved' && photo?.url)
      .map((photo) => photo.url as string);
  }, [params.profile?.photos]);

  const allPhotos = useMemo(() => {
    const merged = [...providedPhotos, ...approvedPhotos];
    return Array.from(new Set(merged));
  }, [approvedPhotos, providedPhotos]);

  const left = params.leftPhoto ?? allPhotos[0] ?? null;
  const profileName = params.profile?.name ?? 'This profile';
  const profileBio = params.profile?.bio ?? null;
  const verificationStatus =
    typeof params.profile?.verification?.status === 'string'
      ? params.profile.verification.status
      : null;
  const verificationLabel = verificationStatus ? `Verification: ${verificationStatus}` : 'Verification pending';
  const isVertical = layout === 'vertical';
  const containerStyle = isVertical ? styles.verticalLayout : styles.horizontalLayout;
  const canSendLike = Boolean(left && rightPhoto && params.profile?.id && session?.user?.id && !isSendingLike);

  const ensurePermission = useCallback(async (
    request: () => Promise<ImagePicker.PermissionResponse>,
    failureMessage: string,
  ) => {
    const result = await request();
    if (!result.granted) {
      throw new Error(failureMessage);
    }
  }, []);

  const handleChooseFromLibrary = useCallback(async () => {
    try {
      await ensurePermission(
        ImagePicker.requestMediaLibraryPermissionsAsync,
        'Media library access is required to pick a photo.',
      );
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      setRightPhoto(asset.uri);
      setRightPhotoSource('library');
      setSelectedPostId(null);
    } catch (error) {
      console.warn('Unable to pick comparison photo from library', error);
      show(error instanceof Error ? error.message : 'Unable to pick a photo right now.');
    }
  }, [ensurePermission, show]);

  const handleTakePhoto = useCallback(async () => {
    try {
      await ensurePermission(ImagePicker.requestCameraPermissionsAsync, 'Camera access is required to take a photo.');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      setRightPhoto(asset.uri);
      setRightPhotoSource('camera');
      setSelectedPostId(null);
    } catch (error) {
      console.warn('Unable to capture comparison photo', error);
      show(error instanceof Error ? error.message : 'Unable to open the camera right now.');
    }
  }, [ensurePermission, show]);

  const handleSelectPost = useCallback((post: { id: string; uri: string }) => {
    setRightPhoto(post.uri);
    setRightPhotoSource('post');
    setSelectedPostId(post.id);
    setIsPostPickerVisible(false);
  }, []);

  const handleClearRightPhoto = useCallback(() => {
    setRightPhoto(null);
    setRightPhotoSource(null);
    setSelectedPostId(null);
    setIsPostPickerVisible(false);
  }, []);

  const handleChooseFromPosts = useCallback(() => {
    if (!viewerPostOptions.length) {
      show('Add a post first to choose one here.');
      return;
    }
    setIsPostPickerVisible(true);
  }, [show, viewerPostOptions.length]);

  const handleOpenRightPhotoMenu = useCallback(() => {
    const optionHandlers = [
      () => handleTakePhoto(),
      () => handleChooseFromLibrary(),
      () => handleChooseFromPosts(),
    ];
    const optionLabels = ['Take a photo', 'Upload from library', 'Choose from posts'];

    if (rightPhoto) {
      optionHandlers.push(() => handleClearRightPhoto());
      optionLabels.push('Remove photo');
    }

    const cancelIndex = optionLabels.length;

    const handleSelection = (index: number | undefined) => {
      if (typeof index !== 'number' || index < 0 || index >= optionHandlers.length) {
        return;
      }
      optionHandlers[index]();
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Add your photo',
          options: [...optionLabels, 'Cancel'],
          cancelButtonIndex: cancelIndex,
        },
        handleSelection,
      );
      return;
    }

    Alert.alert(
      'Add your photo',
      undefined,
      [
        ...optionLabels.map((label, index) => ({ text: label, onPress: optionHandlers[index] })),
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [handleChooseFromLibrary, handleChooseFromPosts, handleTakePhoto, handleClearRightPhoto, rightPhoto]);

  const handleSendLike = useCallback(async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Create an account to send likes.');
      return;
    }
    if (!params.profile?.id) {
      Alert.alert('Missing profile', 'This profile is no longer available.');
      return;
    }
    if (!left || !rightPhoto) {
      Alert.alert('Add your photo', 'Choose a photo on the right before sending your like.');
      return;
    }
    setIsSendingLike(true);
    try {
      const result = await likeUser(session.user.id, params.profile.id);
      console.log('📸 Sending comparison like', {
        leftPhoto: left,
        rightPhoto,
        rightPhotoSource,
        selectedPostId,
        targetUser: params.profile.id,
      });
      if (result.matchCreated) {
        show('It’s a match! Your comparison is on the way.');
      } else {
        show('Comparison sent! They’ll see both photos.');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to send comparison like', error);
      Alert.alert('Unable to send', 'Please try again in a moment.');
    } finally {
      setIsSendingLike(false);
    }
  }, [session?.user?.id, params.profile?.id, left, rightPhoto, rightPhotoSource, selectedPostId, show, navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Compare photos</Text>
          <Text style={styles.subtitle}>{profileName}</Text>
          <Text style={styles.verificationLabel}>{verificationLabel}</Text>
          {profileBio ? <Text style={styles.bio}>{profileBio}</Text> : null}
        </View>

        <View style={styles.toggleRow}>
          {layoutOptions.map((option) => {
            const isActive = layout === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setLayout(option.key)}
                style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
              >
                <Text style={[styles.toggleLabel, isActive && styles.toggleLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View key={layout} style={[styles.compareArea, containerStyle]}>
          <View style={[styles.photoCard, isVertical ? styles.verticalPhotoCard : styles.horizontalPhotoCard]}>
            {left ? (
              <Image source={{ uri: left }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.placeholder]}>
                <Text style={styles.placeholderLabel}>No photo</Text>
              </View>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Choose how to add your photo"
            onPress={handleOpenRightPhotoMenu}
            style={({ pressed }) => [
              styles.photoCard,
              isVertical ? styles.verticalPhotoCard : styles.horizontalPhotoCard,
              pressed && styles.photoCardPressed,
            ]}
          >
            {rightPhoto ? (
              <Image source={{ uri: rightPhoto }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.placeholder]}>
                <Text style={styles.placeholderLabel}>Tap to add photo</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.ctaRow}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSendLike}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && canSendLike && styles.primaryButtonPressed,
              !canSendLike && styles.primaryButtonDisabled,
            ]}
            onPress={handleSendLike}
          >
            <Text style={styles.primaryButtonLabel}>{isSendingLike ? 'Sending…' : 'Send Like'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              (isLoadingNext || !params.context?.items?.length) && styles.secondaryButtonDisabled,
            ]}
            onPress={handleNextProfile}
            disabled={isLoadingNext || !params.context?.items?.length}
          >
            {isLoadingNext ? (
              <ActivityIndicator color="#94a3b8" />
            ) : (
              <Text style={styles.secondaryButtonLabel}>Next profile</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={isPostPickerVisible}
        onRequestClose={() => setIsPostPickerVisible(false)}
      >
        <View style={styles.postPickerBackdrop}>
          <View style={styles.postPickerContainer}>
            <View style={styles.postPickerHeader}>
              <Text style={styles.postPickerTitle}>Choose from posts</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsPostPickerVisible(false)}
                style={({ pressed }) => [styles.postPickerClose, pressed && styles.postPickerClosePressed]}
              >
                <Text style={styles.postPickerCloseLabel}>Close</Text>
              </Pressable>
            </View>
            {viewerPostsQuery.isLoading ? (
              <ActivityIndicator color="#94a3b8" style={styles.postPickerLoading} />
            ) : viewerPostOptions.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.postPickerScroller}
              >
                {viewerPostOptions.map((post) => (
                  <Pressable
                    key={post.id}
                    accessibilityRole="button"
                    onPress={() => handleSelectPost(post)}
                    style={({ pressed }) => [
                      styles.postThumbnailWrapper,
                      selectedPostId === post.id && styles.postThumbnailSelected,
                      pressed && styles.postThumbnailPressed,
                    ]}
                  >
                    <Image source={{ uri: post.uri }} style={styles.postThumbnail} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.postPickerEmptyText}>
                You haven’t shared any posts yet. Add one from your profile to pick it here.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#cbd5f5',
    fontSize: 18,
    fontWeight: '600',
  },
  verificationLabel: {
    color: '#94a3b8',
    marginTop: 4,
  },
  bio: {
    color: '#cbd5f5',
    marginTop: 12,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#111b2e',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
    marginHorizontal: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#a855f7',
  },
  toggleLabel: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#ffffff',
  },
  compareArea: {
    backgroundColor: '#111b2e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 16,
    alignItems: 'stretch',
  },
  verticalLayout: {
    flexDirection: 'column',
  },
  horizontalLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  photoCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    aspectRatio: 3 / 4,
    minHeight: 0,
    minWidth: 0,
  },
  verticalPhotoCard: {
    width: '100%',
  },
  horizontalPhotoCard: {
    flexBasis: 0,
    minWidth: 0,
  },
  photoCardPressed: {
    opacity: 0.9,
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  placeholderLabel: {
    color: '#94a3b8',
  },
  postThumbnailWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  postThumbnailSelected: {
    borderColor: '#a855f7',
  },
  postThumbnailPressed: {
    opacity: 0.85,
  },
  postThumbnail: {
    width: 88,
    height: 118,
    backgroundColor: '#1f2937',
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonLabel: {
    color: '#cbd5f5',
    fontWeight: '700',
    fontSize: 16,
  },
  postPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  postPickerContainer: {
    backgroundColor: '#0b1220',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  postPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postPickerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  postPickerClose: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  postPickerClosePressed: {
    opacity: 0.85,
  },
  postPickerCloseLabel: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  postPickerLoading: {
    marginTop: 12,
  },
  postPickerScroller: {
    gap: 12,
    paddingRight: 4,
  },
  postPickerEmptyText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
});
