import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { api, type PhotoResource } from '@us/api-client';
import { useAuthStore } from '../state/authStore';

type UploadResult = {
  success: boolean;
  photo?: PhotoResource;
};

const FALLBACK_TYPE = Platform.OS === 'ios' ? 'image/jpeg' : 'image/*';

type RNFile = {
  uri: string;
  name: string;
  type: string;
};

export function usePhotoModeration() {
  const user = useAuthStore((state) => state.user);
  const upsertPhoto = useAuthStore((state) => state.upsertUserPhoto);
  const removePhotoFromState = useAuthStore((state) => state.removeUserPhoto);
  const setPhotos = useAuthStore((state) => state.setUserPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const photos = await api.photos.list();
      setPhotos(photos);
    } catch (err) {
      console.error(err);
      setError('Unable to load photos from the server. Showing local data.');
    } finally {
      setIsRefreshing(false);
    }
  }, [setPhotos, user]);

  const uploadPhoto = useCallback(
    async (uri: string): Promise<UploadResult> => {
      if (!uri) {
        return { success: false };
      }
      setError(null);
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: `upload-${Date.now()}.jpg`,
          type: FALLBACK_TYPE,
        } as unknown as RNFile);

        const photo = await api.photos.upload(formData);
        upsertPhoto(photo);
        return { success: true, photo };
      } catch (err) {
        console.error(err);
        setError('Upload failed. Your photo will remain pending until retry.');
        const fallbackPhoto: PhotoResource = {
          id: `local-${Date.now()}`,
          url: uri,
          status: 'pending',
        };
        upsertPhoto(fallbackPhoto);
        return { success: false, photo: fallbackPhoto };
      } finally {
        setIsUploading(false);
      }
    },
    [upsertPhoto],
  );

  const refreshPhoto = useCallback(
    async (photoId: string) => {
      setIsRefreshing(true);
      try {
        const photo = await api.photos.getModerationStatus(photoId);
        upsertPhoto(photo);
      } catch (err) {
        console.error(err);
        setError('Could not refresh moderation status.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [upsertPhoto],
  );

  const retryModeration = useCallback(
    async (photoId: string) => {
      setIsRefreshing(true);
      try {
        const photo = await api.photos.triggerModeration(photoId);
        upsertPhoto(photo);
      } catch (err) {
        console.error(err);
        setError('Unable to request moderation.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [upsertPhoto],
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      removePhotoFromState(photoId);
      try {
        await api.photos.remove(photoId);
      } catch (err) {
        console.error(err);
        setError('Photo removed locally. Sync will resume when you are back online.');
      }
    },
    [removePhotoFromState],
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
    removePhoto,
    loadPhotos,
    clearError,
  };
}
