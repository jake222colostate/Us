import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import type { RootStackParamList } from '../../navigation/RootNavigator';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import { useToast } from '../../providers/ToastProvider';
import { useAuthStore, selectSession } from '../../state/authStore';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { createPost } from '../../api/posts';
import { createLivePost } from '../../api/livePosts';
import { getSupabaseClient } from '../../api/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Post'>;

type ModerationStatus = 'pending' | 'approved' | 'rejected';

const PostScreen: React.FC<Props> = ({ route, navigation }) => {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const session = useAuthStore(selectSession);
  const { show } = useToast();
  const queryClient = useQueryClient();
  const { uploadPhoto, isUploading } = usePhotoModeration();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [hostedUri, setHostedUri] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [status, setStatus] = useState<ModerationStatus | null>(null);
  const [postKind, setPostKind] = useState<'live' | 'regular'>('regular');
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasAutoLaunched, setHasAutoLaunched] = useState(false);
  const createdAtRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setPreviewUri(null);
    setHostedUri(null);
    setStoragePath(null);
    setStatus(null);
    setPostKind('regular');
    createdAtRef.current = null;
  }, []);

  const openCamera = useCallback(
    async (kind: 'live' | 'regular') => {
      if (!session) {
        show('Sign in to post.');
        return;
      }

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        show('Camera permission denied.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result || result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setPreviewUri(asset.uri);
      setStatus('pending');
      setPostKind(kind);
      createdAtRef.current = new Date().toISOString();

      const uploadResult = await uploadPhoto({ asset }, { kind: 'post' });
      console.log('📤 uploadPhoto result', uploadResult);

      if (!uploadResult.success || !uploadResult.photo) {
        show('Upload failed. Try again.');
        reset();
        return;
      }

      setStoragePath(uploadResult.photo.storagePath);
      setHostedUri(uploadResult.photo.url ?? null);
      setStatus(uploadResult.photo.status ?? 'pending');
    },
    [session, show, uploadPhoto, reset],
  );

  const openLibrary = useCallback(async () => {
    if (!session) {
      show('Sign in to post.');
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      show('Library permission denied.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!result || result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setStatus('pending');
    setPostKind('regular');
    createdAtRef.current = new Date().toISOString();

    const uploadResult = await uploadPhoto({ asset }, { kind: 'post' });
    console.log('📤 uploadPhoto result', uploadResult);

    if (!uploadResult.success || !uploadResult.photo) {
      show('Upload failed. Try again.');
      reset();
      return;
    }

    setStoragePath(uploadResult.photo.storagePath);
    setHostedUri(uploadResult.photo.url ?? null);
    setStatus(uploadResult.photo.status ?? 'pending');
  }, [session, show, uploadPhoto, reset]);

  // Auto-launch based on incoming mode (live / take / upload)
  useEffect(() => {
    const mode = route.params?.mode;
    if (hasAutoLaunched || !mode) return;
    setHasAutoLaunched(true);

    if (mode === 'live') {
      void openCamera('live');
    } else if (mode === 'take') {
      void openCamera('regular');
    } else if (mode === 'upload') {
      void openLibrary();
    }
  }, [route.params?.mode, hasAutoLaunched, openCamera, openLibrary]);

  // Poll moderation status from photos table
  useEffect(() => {
    if (!storagePath) return;

    let cancelled = false;
    const client = getSupabaseClient();

    const poll = async () => {
      try {
        const { data, error } = await client
          .from('photos')
          .select('status, storage_path, created_at')
          .eq('storage_path', storagePath)
          .maybeSingle();

        console.log('📡 pollStatus raw', {
          data,
          error,
          hostedPath: storagePath,
        });

        if (cancelled || error || !data) return;

        let next: ModerationStatus =
          (data.status as ModerationStatus | null) ?? 'pending';

        // small grace window before surfacing "rejected"
        if (
          next === 'rejected' &&
          createdAtRef.current &&
          Date.now() - Date.parse(createdAtRef.current) < 10_000
        ) {
          next = 'pending';
        }

        if (next !== status) {
          console.log('📡 moderation status update', {
            hostedPath: storagePath,
            rawStatus: data.status,
            normalized: next,
          });
          setStatus(next);
        }
      } catch (err) {
        console.warn('Failed to poll photo status', err);
      }
    };

    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [storagePath, status]);

  const handleClose = useCallback(() => {
    reset();
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs' as never, { screen: 'Feed' } as never);
      }
    } catch {
      navigation.navigate('MainTabs' as never, { screen: 'Feed' } as never);
    }
  }, [navigation, reset]);

  const handlePublish = useCallback(async () => {
    if (!session) {
      show('Sign in to post.');
      return;
    }
    if (!hostedUri || !storagePath) {
      show('No photo to post.');
      return;
    }
    if (status !== 'approved') {
      show('Photo must be approved before posting.');
      return;
    }

    setIsPublishing(true);
    try {
      if (postKind === 'live') {
        const liveExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await createLivePost({
          userId: session.user.id,
          photoUrl: hostedUri,
          liveExpiresAt,
        });
        show('Live Photo posted! You are featured for the next hour.');
      } else {
        await createPost({
          userId: session.user.id,
          photoUrl: hostedUri,
          storagePath,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['feed'] }),
          queryClient.invalidateQueries({
            queryKey: ['profile-posts', session.user.id],
          }),
        ]);
        show('Photo posted!');
      }

      reset();
      navigation.navigate('MainTabs' as never, { screen: 'Feed' } as never);
    } catch (err: any) {
      console.error('Failed to publish post', err);
      if (postKind === 'live' && err?.code === '23505') {
        show('You already have a live photo today. Try again later.');
      } else {
        show('Could not publish. Try again.');
      }
    } finally {
      setIsPublishing(false);
    }
  }, [
    session,
    hostedUri,
    storagePath,
    status,
    postKind,
    queryClient,
    navigation,
    reset,
    show,
  ]);

  const isCtaDisabled =
    isUploading || isPublishing || !hostedUri || status !== 'approved';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <Pressable
            accessibilityLabel="Close"
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>

          {previewUri ? (
            <>
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusPill,
                    status === 'approved'
                      ? styles.statusApproved
                      : status === 'rejected'
                      ? styles.statusRejected
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusLabel,
                      status === 'pending'
                        ? styles.statusLabelPending
                        : styles.statusLabelDefault,
                    ]}
                  >
                    {status === 'approved'
                      ? 'Approved'
                      : status === 'rejected'
                      ? 'Rejected'
                      : 'Pending review'}
                  </Text>
                </View>
                {isUploading && (
                  <View style={styles.uploadingRow}>
                    <ActivityIndicator size="small" color="#e5e7eb" />
                    <Text style={styles.uploadingLabel}>Uploading…</Text>
                  </View>
                )}
              </View>

              <Pressable
                style={styles.retakeButton}
                onPress={() => {
                  reset();
                  void openLibrary();
                }}
              >
                <Text style={styles.retakeLabel}>Pick a different photo</Text>
              </Pressable>

              <Pressable
                onPress={handlePublish}
                disabled={isCtaDisabled}
                style={[
                  styles.ctaButton,
                  isCtaDisabled && styles.ctaButtonDisabled,
                ]}
              >
                {isPublishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaLabel}>
                    {postKind === 'live' ? 'Upload to Live Feed' : 'Upload'}
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#60a5fa" />
              <Text style={styles.loadingLabel}>
                Choose how you want to add a photo.
              </Text>
              <View style={styles.loadingButtonsRow}>
                <Pressable
                  style={styles.loadingButton}
                  onPress={() => void openCamera('regular')}
                >
                  <Text style={styles.loadingButtonLabel}>Take photo</Text>
                </Pressable>
                <Pressable
                  style={styles.loadingButton}
                  onPress={() => void openLibrary()}
                >
                  <Text style={styles.loadingButtonLabel}>
                    Choose from library
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#050816',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 24,
      paddingBottom: 24,
      paddingTop: 32,
    },
    panel: {
      backgroundColor: '#020617',
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    closeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15,23,42,0.9)',
      zIndex: 1,
    },
    closeIcon: {
      color: '#e5e7eb',
      fontSize: 18,
    },
    previewImage: {
      width: '100%',
      height: 420,
      borderRadius: 16,
      marginBottom: 16,
      backgroundColor: '#020617',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    statusApproved: {
      backgroundColor: '#22c55e',
    },
    statusRejected: {
      backgroundColor: '#ef4444',
    },
    statusPending: {
      backgroundColor: '#eab308',
    },
    statusLabel: {
      fontWeight: 'bold',
      fontSize: 14,
    },
    statusLabelDefault: {
      color: '#020617',
    },
    statusLabelPending: {
      color: '#111827',
    },
    uploadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    uploadingLabel: {
      color: '#9ca3af',
      fontSize: 12,
    },
    retakeButton: {
      marginBottom: 8,
    },
    retakeLabel: {
      paddingVertical: 8,
      color: '#60a5fa',
      fontWeight: 'bold',
      fontSize: 14,
    },
    ctaButton: {
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 999,
      alignItems: 'center',
      backgroundColor: '#2563eb',
    },
    ctaButtonDisabled: {
      backgroundColor: '#4b5563',
    },
    ctaLabel: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    loadingContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 16,
    },
    loadingLabel: {
      color: '#e5e7eb',
      textAlign: 'center',
    },
    loadingButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    loadingButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: '#111827',
      alignItems: 'center',
    },
    loadingButtonLabel: {
      color: '#e5e7eb',
      fontWeight: '600',
      fontSize: 14,
    },
  });
}

export default PostScreen;
