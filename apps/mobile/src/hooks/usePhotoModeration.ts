import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { api, type PhotoResource } from '@us/api-client';
import { useAuthStore, selectIsPremium, selectCurrentUser } from '../state/authStore';
import { usePostQuotaStore } from '../state/postQuotaStore';
import { useUserPostsStore } from '../state/userPostsStore';

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
  const user = useAuthStore(selectCurrentUser);
  const upsertPhoto = useAuthStore((state) => state.upsertUserPhoto);
  const removePhotoFromState = useAuthStore((state) => state.removeUserPhoto);
  const setPhotos = useAuthStore((state) => state.setUserPhotos);
  const isPremium = useAuthStore(selectIsPremium);
  const { canPost, markPosted } = usePostQuotaStore((state) => ({
    canPost: state.canPost,
    markPosted: state.markPosted,
  }));
  const addUserPost = useUserPostsStore((state) => state.addPost);
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
      const dailyLimit = isPremium ? 20 : 3;
      if (!canPost(dailyLimit)) {
        setError(
          `You have reached your daily posting limit of ${dailyLimit} photos. Upgrade to premium to share more.`,
        );
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
        if (user && photo.url) {
          addUserPost({
            id: photo.id,
            userId: user.id,
            name: user.name,
            age: user.age,
            bio: user.bio,
            avatar: user.avatar,
            photoUrl: photo.url,
            createdAt: Date.now(),
          });
        }
        markPosted();
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
        if (user) {
          addUserPost({
            id: fallbackPhoto.id,
            userId: user.id,
            name: user.name,
            age: user.age,
            bio: user.bio,
            avatar: user.avatar,
            photoUrl: uri,
            createdAt: Date.now(),
          });
        }
        markPosted();
        return { success: false, photo: fallbackPhoto };
      } finally {
        setIsUploading(false);
      }
    },
    [addUserPost, canPost, isPremium, markPosted, upsertPhoto, user],
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
