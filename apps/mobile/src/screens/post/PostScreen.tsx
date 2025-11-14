import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import { useAuthStore, selectSession } from '../../state/authStore';
import { useToast } from '../../providers/ToastProvider';
import { getSupabaseClient } from '../../api/supabase';
import { createPost } from '../../api/posts';
import { useQueryClient } from '@tanstack/react-query';
import type { ModerationStatus } from '../../lib/photos';

const POLL_INTERVAL_MS = 4000;

const PostScreen: React.FC = () => {
  const session = useAuthStore(selectSession);
  const { uploadPhoto, isUploading } = usePhotoModeration();
  const { show } = useToast();
  const queryClient = useQueryClient();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [hostedPath, setHostedPath] = useState<string | null>(null);
  const [hostedUri, setHostedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ModerationStatus>(null);
  const [isPublishing, setIsPublishing] = useState(false);

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
      setPreviewUri(asset.uri);
      setStatus('pending');

      const uploadResult = await uploadPhoto({ asset });
      console.log('📤 uploadPhoto result', uploadResult);

      if (!uploadResult.success || !uploadResult.photo) {
        show('Upload failed. Try again.');
        return;
      }

      const photo = uploadResult.photo;
      const initialStatus: ModerationStatus = photo.status ?? 'pending';

      setHostedPath(photo.storagePath ?? null);
      setHostedUri(photo.url ?? null);
      setStatus(initialStatus);

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
      const normalized: ModerationStatus =
        raw === 'approved' ? 'approved' : raw === 'rejected' ? 'rejected' : 'pending';

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
    [hostedPath, status],
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
  }, []);

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
      resetPhoto();
    } catch (e) {
      console.error('Failed to publish post', e);
      show('Could not publish. Try again.');
    } finally {
      setIsPublishing(false);
    }
  }, [session, hostedUri, hostedPath, status, queryClient, resetPhoto, show]);

  const disabled = isUploading || isPublishing || !hostedUri || status !== 'approved';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050816' }}>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!previewUri && (
          <View style={{ width: '100%', gap: 16 }}>
            <Pressable
              onPress={() => launchPicker(true)}
              style={{
                backgroundColor: '#2563eb',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>
                Take Photo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => launchPicker(false)}
              style={{
                backgroundColor: '#111827',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#374151',
              }}
            >
              <Text style={{ fontSize: 18, color: '#e5e7eb', fontWeight: 'bold' }}>
                Pick From Library
              </Text>
            </Pressable>
          </View>
        )}

        {previewUri && (
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
                  Upload to Feed
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostScreen;
