import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from '../api/supabase';
import {
  useAuthStore,
  selectCurrentUser,
  selectIsPremium,
  selectSession,
} from '../state/authStore';
import { usePostQuotaStore } from '../state/postQuotaStore';
import { mapPhotoRow, type PhotoRow, PROFILE_PHOTO_BUCKET } from '../lib/photos';

const FALLBACK_TYPE = Platform.OS === 'ios' ? 'image/jpeg' : 'image/jpg';

export function usePhotoModeration() {
  const session = useAuthStore(selectSession);
  const user = useAuthStore(selectCurrentUser);
  const upsertPhoto = useAuthStore((state) => state.upsertUserPhoto);
  const removePhotoFromState = useAuthStore((state) => state.removeUserPhoto);
  const setPhotos = useAuthStore((state) => state.setUserPhotos);
  const isPremium = useAuthStore(selectIsPremium);
  const { canPost, markPosted } = usePostQuotaStore((state) => ({
    canPost: state.canPost,
    markPosted: state.markPosted,
  }));
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    if (!session) return;
    setIsRefreshing(true);
    try {
      const client = getSupabaseClient();
      const { data, error: listError } = await client
        .from('photos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (listError) throw listError;
      const mapped = await Promise.all(((data ?? []) as PhotoRow[]).map((row) => mapPhotoRow(row)));
      setPhotos(mapped);
    } catch (err) {
      console.error(err);
      setError('Unable to load photos from Supabase.');
    } finally {
      setIsRefreshing(false);
    }
  }, [session, setPhotos]);

  const uploadPhoto = useCallback(
    async (uri: string) => {
      if (!session) {
        setError('Sign in to upload photos.');
        return { success: false };
      }

      const dailyLimit = isPremium ? 20 : 3;
      if (!canPost(dailyLimit)) {
        setError(`You reached your daily limit of ${dailyLimit} uploads. Upgrade to share more.`);
        return { success: false };
      }

      setIsUploading(true);
      setError(null);

      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const contentType = blob.type || FALLBACK_TYPE;
        const extension = contentType.split('/')[1] || 'jpg';
        const fileName = `${Crypto.randomUUID()}.${extension}`;
        const path = `${session.user.id}/${fileName}`;

        const client = getSupabaseClient();
        const { error: uploadError } = await client.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(path, blob, { contentType, upsert: false });
        if (uploadError) {
          throw uploadError;
        }

        const { data, error: insertError } = await client
          .from('photos')
          .insert({ user_id: session.user.id, url: path, status: 'pending' })
          .select('*')
          .single();
        if (insertError) {
          await client.storage.from(PROFILE_PHOTO_BUCKET).remove([path]).catch(() => undefined);
          throw insertError;
        }

        const mapped = await mapPhotoRow(data as PhotoRow);
        upsertPhoto(mapped);
        markPosted();
        return { success: true, photo: mapped };
      } catch (err) {
        console.error(err);
        setError('Upload failed. Try again when you are back online.');
        return { success: false };
      } finally {
        setIsUploading(false);
      }
    },
    [session, isPremium, canPost, upsertPhoto, markPosted],
  );

  const refreshPhoto = useCallback(
    async (photoId: string) => {
      if (!session) return;
      setIsRefreshing(true);
      try {
        const client = getSupabaseClient();
        const { data, error: refreshError } = await client
          .from('photos')
          .select('*')
          .eq('id', photoId)
          .single();
        if (refreshError) throw refreshError;
        const mapped = await mapPhotoRow(data as PhotoRow);
        upsertPhoto(mapped);
      } catch (err) {
        console.error(err);
        setError('Could not refresh moderation status.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [session, upsertPhoto],
  );

  const retryModeration = useCallback(
    async (photoId: string) => {
      if (!session) return;
      setIsRefreshing(true);
      try {
        const client = getSupabaseClient();
        const { data, error: updateError } = await client
          .from('photos')
          .update({ status: 'pending', rejection_reason: null })
          .eq('id', photoId)
          .select('*')
          .single();
        if (updateError) throw updateError;
        const mapped = await mapPhotoRow(data as PhotoRow);
        upsertPhoto(mapped);
      } catch (err) {
        console.error(err);
        setError('Unable to request moderation.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [session, upsertPhoto],
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      if (!session) return;
      const client = getSupabaseClient();
      const photo = user?.photos.find((item) => item.id === photoId);
      removePhotoFromState(photoId);
      try {
        if (photo?.storagePath) {
          await client.storage.from(PROFILE_PHOTO_BUCKET).remove([photo.storagePath]);
        }
        await client.from('photos').delete().eq('id', photoId);
      } catch (err) {
        console.error(err);
        setError('Photo removed locally. It will sync once back online.');
      }
    },
    [session, user?.photos, removePhotoFromState],
  );

  const approvePhoto = useCallback(
    async (photoId: string) => {
      if (!session) return;
      setIsRefreshing(true);
      try {
        const client = getSupabaseClient();
        const { data, error: approveError } = await client
          .from('photos')
          .update({ status: 'approved', rejection_reason: null })
          .eq('id', photoId)
          .select('*')
          .single();
        if (approveError) throw approveError;
        const mapped = await mapPhotoRow(data as PhotoRow);
        upsertPhoto(mapped);
      } catch (err) {
        console.error(err);
        setError('Failed to approve photo.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [session, upsertPhoto],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isUploading,
    isRefreshing,
    error,
    uploadPhoto,
    refreshPhoto,
    retryModeration,
    approvePhoto,
    removePhoto,
    loadPhotos,
    clearError,
  };
}
