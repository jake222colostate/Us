import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as base64Decode } from 'base-64';
import { getSupabaseClient } from '../api/supabase';
import { useAuthStore, selectSession, selectVerificationStatus } from '../state/authStore';
import { POST_PHOTO_BUCKET } from '../lib/photos';

function toBytes(base64: string): Uint8Array {
  const decode = typeof globalThis.atob === 'function' ? globalThis.atob : base64Decode;
  const binary = decode(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function guessContentType(uri: string | null, fileName?: string | null): string {
  const source = fileName || uri || '';
  const ext = source.split('.').pop()?.toLowerCase();
  if (!ext) return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

export function useIdentityVerification() {
  const session = useAuthStore(selectSession);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beginVerification = useCallback(async () => {
    if (!session?.user) {
      setError('Sign in to verify your identity.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        setError('Camera permission is required to verify your ID.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result || result.canceled || !result.assets || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      if (!uri) {
        setError('Could not read captured ID.');
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = toBytes(base64);
      const contentType = guessContentType(uri, (asset as any).fileName ?? null);

      const client = getSupabaseClient();
      const storagePath = `${session.user.id}/id-${Date.now()}.jpg`;

      const { error: uploadError } = await client.storage
        .from(POST_PHOTO_BUCKET)
        .upload(storagePath, bytes, { contentType, upsert: false });

      if (uploadError) {
        console.error('ID upload error', uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = client.storage
        .from(POST_PHOTO_BUCKET)
        .getPublicUrl(storagePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Unable to resolve ID photo URL');
      }

      const { error: insertError } = await client
        .from('id_verifications')
        .insert({
          user_id: session.user.id,
          id_photo_url: publicUrl,
          status: 'pending',
        });

      if (insertError) {
        console.error('id_verifications insert error', insertError);
        throw insertError;
      }

      // Optimistic local state: show as pending
      useAuthStore.setState((prev) => ({
        ...prev,
        verificationStatus: 'pending',
      }));
    } catch (err) {
      console.error('Identity verification failed', err);
      setError('Could not start verification. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  return {
    beginVerification,
    isLoading,
    error,
    currentStatus: verificationStatus,
  };
}
