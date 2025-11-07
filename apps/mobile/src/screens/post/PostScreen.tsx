import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { FlipType, SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import type { ModerationStatus } from '../../lib/photos';
import { PROFILE_PHOTO_BUCKET } from '../../lib/photos';
import { useToast } from '../../providers/ToastProvider';
import { useThemeStore } from '../../state/themeStore';
import { useAuthStore, selectSession } from '../../state/authStore';
import { getSupabaseClient } from '../../api/supabase';
import { checkLiveGuard, createLivePost } from '../../api/livePosts';
import type { MainTabParamList } from '../../navigation/tabs/MainTabs';
import { createPost } from '../../api/posts';

const PREVIEW_ASPECT_RATIO = 3 / 4;
const PREVIEW_MAX_WIDTH = 360;

const PostScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Post'>>();
  const queryClient = useQueryClient();
  const { uploadPhoto, isUploading } = usePhotoModeration();
  const session = useAuthStore(selectSession);
  const { show } = useToast();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [hostedUri, setHostedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ModerationStatus | null>(null);
  const [pendingSelection, setPendingSelection] = useState(false);
  const [isPostingLive, setIsPostingLive] = useState(false);
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  const mirrorAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const result = await manipulateAsync(
        asset.uri,
        [{ flip: FlipType.Horizontal }],
        {
          compress: asset.base64 ? 1 : 0.9,
          format: SaveFormat.JPEG,
        },
      );

      return {
        ...asset,
        uri: result.uri,
        width: result.width ?? asset.width,
        height: result.height ?? asset.height,
      };
    } catch (error) {
      console.error('Failed to mirror photo', error);
      return asset;
    }
  }, []);

  const handleSelect = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          show(
            source === 'camera'
              ? 'Camera access is required to take a photo.'
              : 'Media library access is required to pick a photo.',
          );
          return;
        }

        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                quality: 0.8,
                exif: true,
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsMultipleSelection: false,
                quality: 0.8,
                exif: true,
              });

        if (result.canceled || !result.assets?.length) {
          return;
        }

        let asset = result.assets[0];
        if (source === 'camera') {
          asset = await mirrorAsset(asset);
        }

        setPreviewUri(asset.uri);
        setHostedUri(null);
        setStatus('pending');
        setPendingSelection(true);

        const outcome = await uploadPhoto({ asset });
        setPendingSelection(false);

        if (!outcome.success) {
          show('Upload failed. Please try again once you have a stable connection.');
          return;
        }

        const finalStatus = outcome.status ?? 'pending';
        setStatus(finalStatus);

        if (!outcome.photo?.url) {
          show('Upload succeeded but the photo URL is missing. Please try again.');
          return;
        }

        if (finalStatus === 'rejected') {
          show('This photo was rejected by moderation. Try another one.');
          setPreviewUri(null);
          setHostedUri(null);
          return;
        }

        setHostedUri(outcome.photo.url);

        if (!session) {
          show('Sign in to share your moments to the feed.');
          return;
        }

        try {
          setIsPublishingPost(true);
          await createPost({ userId: session.user.id, photoUrl: outcome.photo.url });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['feed'] }),
            queryClient.invalidateQueries({ queryKey: ['profile-posts', session.user.id] }),
          ]);
          if (finalStatus === 'approved') {
            show('Photo posted! It is now live in the feed and on your profile.');
          } else {
            show('Photo submitted! It will appear once it is approved.');
          }
        } catch (postError) {
          console.error('Failed to publish post', postError);
          show('Photo uploaded, but we could not publish it. Please try again.');
        } finally {
          setIsPublishingPost(false);
        }
      } catch (err) {
        console.error('Photo selection failed', err);
        show('Something went wrong while selecting your photo. Please try again.');
      }
    },
    [uploadPhoto, show, session, queryClient, mirrorAsset],
  );

  const ensureUuid = useCallback(() => {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return Crypto.randomUUID();
  }, []);

  const toBytes = useCallback((base64: string) => {
    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    const buffer = Buffer.from(base64, 'base64');
    return new Uint8Array(buffer);
  }, []);

  const handlePostLive = useCallback(async () => {
    if (!session) {
      show('Sign in to post a Live Photo.');
      return;
    }

    if (Platform.OS !== 'ios') {
      show('Live Photos require iOS and must be captured with your camera.');
      return;
    }

    setIsPostingLive(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        show('Camera access is required to capture a Live Photo.');
        return;
      }

      const guard = await checkLiveGuard(session.user.id);
      if (!guard.allowed) {
        const nextAt = guard.nextAllowedAt
          ? new Date(guard.nextAllowedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : null;
        show(
          nextAt
            ? `You already shared a Live Photo today. You can post again after ${nextAt}.`
            : 'You already shared a Live Photo today. Try again tomorrow.',
        );
        return;
      }

      const captureResult = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        exif: true,
      });

      if (captureResult.canceled || !captureResult.assets?.length) {
        return;
      }

      let asset = captureResult.assets[0];
      asset = await mirrorAsset(asset);

      let contentType: string = 'image/jpeg';
      let extension: string = 'jpg';
      const lowerUri = asset.uri.toLowerCase();
      if (lowerUri.endsWith('.heic')) {
        contentType = 'image/heic';
        extension = 'heic';
      } else if (lowerUri.endsWith('.heif')) {
        contentType = 'image/heif';
        extension = 'heif';
      }

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = toBytes(base64);
      const path = `live/${session.user.id}/${ensureUuid()}.${extension}`;
      const client = getSupabaseClient();
      const { error: uploadError } = await client.storage
        .from(PROFILE_PHOTO_BUCKET)
        .upload(path, bytes, { contentType, upsert: false });
      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = client.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Unable to resolve uploaded Live Photo URL.');
      }

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await createLivePost({
        userId: session.user.id,
        photoUrl: publicUrl,
        liveExpiresAt: expiresAt,
      });

      show('Live Photo posted! You are featured for the next hour.');
      navigation.navigate('Feed');
    } catch (error) {
      console.error('Failed to post Live Photo', error);
      show('Unable to post Live Photo. Please try again in a moment.');
    } finally {
      setIsPostingLive(false);
    }
  }, [session, show, toBytes, ensureUuid, navigation, mirrorAsset]);

  const currentPreview = hostedUri ?? previewUri;
  const showSpinner = isUploading || pendingSelection || isPublishingPost;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.liveCard}>
          <Text style={styles.liveTitle}>Live Photo</Text>
          <Text style={styles.liveCopy}>
            Share a photo of what's happening now to jump to the top of the feed. Available once per day.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.liveButton,
              (isPostingLive || Platform.OS !== 'ios') && styles.liveButtonDisabled,
              pressed && styles.liveButtonPressed,
            ]}
            onPress={handlePostLive}
            disabled={isPostingLive || Platform.OS !== 'ios'}
          >
            {isPostingLive ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.liveButtonLabel}>
                {Platform.OS === 'ios' ? 'Post Live Photo' : 'Live Photos are iOS-only'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Share a new moment</Text>
          <Text style={styles.subtitle}>Capture something now or pull from your camera roll.</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => handleSelect('camera')}
              disabled={showSpinner}
            >
              <Text style={styles.buttonLabel}>Open Camera</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => handleSelect('library')}
              disabled={showSpinner}
            >
              <Text style={styles.buttonLabel}>Pick from Library</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.previewWrapper}>
          <View style={styles.previewFrame}>
            {currentPreview ? (
              <Image source={{ uri: currentPreview }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={[styles.previewImage, styles.previewPlaceholder]}>
                <Text style={styles.previewPlaceholderText}>Select a photo to preview it here.</Text>
              </View>
            )}
            {showSpinner && (
              <View style={styles.previewSpinner}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            {status && !showSpinner && (
              <View
                style={[
                  styles.badge,
                  status === 'approved'
                    ? styles.badgeApproved
                    : status === 'rejected'
                    ? styles.badgeRejected
                    : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>
                  {status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending review' : 'Rejected'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(isDarkMode: boolean) {
  const background = isDarkMode ? '#0b1220' : '#fdf8ff';
  const textPrimary = isDarkMode ? '#f8fafc' : '#2f0c4d';
  const textSecondary = isDarkMode ? '#94a3b8' : '#5b4d71';
  const placeholderBorder = isDarkMode ? '#334155' : '#d4c2f4';
  const placeholderBackground = isDarkMode ? '#111b2e' : '#f6ecff';
  const placeholderText = isDarkMode ? '#64748b' : '#7c699b';
  const overlay = isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 209, 255, 0.4)';
  const liveBackground = isDarkMode ? '#111b2e' : '#f2e6ff';
  const liveBorder = isDarkMode ? '#273552' : '#d8c2f6';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 40,
    },
    liveCard: {
      borderWidth: 1,
      borderColor: liveBorder,
      backgroundColor: liveBackground,
      padding: 20,
      borderRadius: 20,
      marginBottom: 24,
      gap: 12,
    },
    liveTitle: {
      color: textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    liveCopy: {
      color: textSecondary,
      lineHeight: 20,
    },
    liveButton: {
      backgroundColor: '#f472b6',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    liveButtonDisabled: {
      opacity: 0.6,
    },
    liveButtonPressed: {
      opacity: 0.9,
    },
    liveButtonLabel: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
    header: {
      marginBottom: 24,
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: textPrimary,
    },
    subtitle: {
      fontSize: 16,
      color: textSecondary,
      lineHeight: 22,
    },
    previewWrapper: {
      alignItems: 'center',
      marginBottom: 32,
    },
    previewFrame: {
      width: '100%',
      maxWidth: PREVIEW_MAX_WIDTH,
      aspectRatio: PREVIEW_ASPECT_RATIO,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: placeholderBorder,
      backgroundColor: placeholderBackground,
      overflow: 'hidden',
      position: 'relative',
      justifyContent: 'center',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    previewPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    previewPlaceholderText: {
      color: placeholderText,
      textAlign: 'center',
      fontSize: 16,
    },
    previewSpinner: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: overlay,
    },
    badge: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    badgeText: {
      fontWeight: '600',
      color: '#fff',
      fontSize: 13,
    },
    badgeApproved: {
      backgroundColor: '#22c55e',
    },
    badgePending: {
      backgroundColor: '#f59e0b',
    },
    badgeRejected: {
      backgroundColor: '#ef4444',
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: '#f472b6',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonLabel: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
  });
}

export default PostScreen;
