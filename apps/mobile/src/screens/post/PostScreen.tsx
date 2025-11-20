import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import { useAuthStore, selectSession } from '../../state/authStore';
import { useToast } from '../../providers/ToastProvider';
import { getSupabaseClient } from '../../api/supabase';
import { createPost } from '../../api/posts';
import { createLivePost } from '../../api/livePosts';
import { useQueryClient } from '@tanstack/react-query';
import type { ModerationStatus } from '../../lib/photos';

const POLL_INTERVAL_MS = 4000;

const PostScreen: React.FC = () => {
  const route = useRoute<any>();
  const mode = (route.params as { mode?: 'live' | 'upload' | 'take' } | undefined)?.mode;
  const session = useAuthStore(selectSession);
  const { uploadPhoto, isUploading } = usePhotoModeration();
  const { show } = useToast();
  const queryClient = useQueryClient();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [hostedPath, setHostedPath] = useState<string | null>(null);
  const [hostedUri, setHostedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ModerationStatus>(null);
  const [selectionStartedAt, setSelectionStartedAt] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postKind, setPostKind] = useState<'live' | 'regular' | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const launchPicker = useCallback(
    async (fromCamera: boolean) => {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        show(fromCamera ? 'Camera permission denied.' : 'Library permission denied.');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: false,
          });

      if (!result || result.canceled || !result.assets || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];

      // Local live preview from the device
      setPreviewUri(asset.uri);
      setStatus('pending');
      setSelectionStartedAt(Date.now());

      // Upload to moderation / photos table
      const uploadResult = await uploadPhoto({ asset });
      console.log('📤 uploadPhoto result', uploadResult);

      if (!uploadResult.success || !uploadResult.photo) {
        show('Upload failed. Try again.');
        return;
      }

      const photo = uploadResult.photo;

      // Track Supabase storage path + public URL for when we actually post
      setHostedPath(photo.storagePath ?? null);
      setHostedUri(photo.url ?? null);

      show('Photo submitted for moderation.');
    },
    [show, uploadPhoto],
  );

  const pollStatus = useCallback(
    async () => {
      if (!hostedPath) {
        return;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('photos')
        .select('id, status, storage_path, created_at')
        .eq('storage_path', hostedPath)
        .maybeSingle();

      console.log('📡 pollStatus raw', { hostedPath, data, error });

      if (error || !data) {
        return;
      }

      const raw = (data.status ?? 'pending').toString().toLowerCase().trim();
      let normalized: ModerationStatus =
        raw === 'approved' ? 'approved' : raw === 'rejected' ? 'rejected' : 'pending';

      // For the first 10s after selection, suppress early "rejected" flashes.
      if (normalized === 'rejected' && selectionStartedAt && Date.now() - selectionStartedAt < 10000) {
        normalized = 'pending';
      }

      if (normalized !== status) {
        console.log('📡 moderation status update', {
          hostedPath,
          rawStatus: data.status,
          normalized,
          created_at: data.created_at,
        });
        setStatus(normalized);
      }

      if (data.storage_path && data.storage_path !== hostedPath) {
        const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-photos/${data.storage_path}`;
        console.log('🔗 updating hostedPath/hostedUri from pollStatus', {
          oldHostedPath: hostedPath,
          newStoragePath: data.storage_path,
          url,
        });
        setHostedPath(data.storage_path);
        setHostedUri(url);
      }
    },
    [hostedPath, status, selectionStartedAt],
  );

  useEffect(() => {
    if (!hostedPath) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await pollStatus();
    };

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [hostedPath, pollStatus]);

  const resetPhoto = useCallback(() => {
    setPreviewUri(null);
    setHostedPath(null);
    setHostedUri(null);
    setStatus(null);
    setSelectionStartedAt(null);
    setIsLiveMode(false);
  }, []);

  useEffect(() => {
    if (!mode) return;
    if (previewUri || hostedUri || isUploading) return;

    if (mode === 'live') {
      setPostKind('live');
      launchPicker(true);
    } else if (mode === 'take') {
      setPostKind('regular');
      launchPicker(true);
    } else if (mode === 'upload') {
      setPostKind('regular');
      launchPicker(false);
    }
  }, [mode, previewUri, hostedUri, isUploading, launchPicker, setPostKind]);

  const showLibraryMenu = useCallback(() => {
    const options = ['Open Camera', 'Choose From Library', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Update profile photo',
          message: 'Choose how you would like to add a new profile picture.',
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            launchPicker(true);
          } else if (buttonIndex === 1) {
            launchPicker(false);
          }
        },
      );
      return;
    }

    Alert.alert('Select Option', undefined, [
      { text: 'Open Camera', onPress: () => { setPostKind('regular'); launchPicker(true); } },
      { text: 'Choose From Library', onPress: () => { setPostKind('regular'); launchPicker(false); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [launchPicker]);

  const handlePost = useCallback(async () => {
    if (!session) {
      show('Sign in to post.');
      return;
    }
    if (!hostedUri) {
      show('No photo to post.');
      return;
    }
    if (status !== 'approved') {
      show('Photo must be approved before posting.');
      return;
    }

    try {
      setIsPublishing(true);

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
          storagePath: hostedPath ?? undefined,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['feed'] }),
          queryClient.invalidateQueries({ queryKey: ['profile-posts', session.user.id] }),
        ]);

        show('Photo posted!');
      }

      resetPhoto();
    } catch (e) {
      console.error('Failed to publish post', e);
      show('Could not publish. Try again.');
    } finally {
      setIsPublishing(false);
    }
  }, [session, hostedUri, hostedPath, status, postKind, queryClient, resetPhoto, show]);


  const disabled = isUploading || isPublishing || !hostedUri || status !== 'approved';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050816' }}>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {previewUri ? (
          <View
            style={{
              backgroundColor: '#020617',
              width: '100%',
              borderRadius: 20,
              padding: 16,
              marginTop: 16,
              shadowColor: '#000',
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            <Image
              source={{ uri: previewUri }}
              style={{
                width: '100%',
                height: 420,
                borderRadius: 16,
                marginBottom: 16,
                backgroundColor: '#020617',
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor:
                    status === 'approved'
                      ? '#22c55e'
                      : status === 'rejected'
                      ? '#ef4444'
                      : '#eab308',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: status === 'pending' ? '#111827' : '#020617',
                    fontSize: 14,
                  }}
                >
                  {status === 'approved'
                    ? 'Approved'
                    : status === 'rejected'
                    ? 'Rejected'
                    : 'Pending review'}
                </Text>
              </View>

              {isUploading && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator color="#e5e7eb" />
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Uploading…</Text>
                </View>
              )}
            </View>

            <Pressable onPress={resetPhoto} style={{ marginBottom: 8 }}>
              <Text
                style={{
                  paddingVertical: 8,
                  color: '#60a5fa',
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
              >
                Retake / Pick New Photo
              </Text>
            </Pressable>

                        <Pressable
              onPress={handlePost}
              disabled={disabled}
              style={{
                marginTop: 8,
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: 'center',
                backgroundColor: disabled ? '#4b5563' : '#2563eb',
              }}
            >
              {isPublishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  {postKind === 'live' ? 'Upload to Live Feed' : 'Upload'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 48, alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color="#60a5fa" />
            <Text style={{ color: '#e5e7eb' }}>Preparing your photo…</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostScreen;
