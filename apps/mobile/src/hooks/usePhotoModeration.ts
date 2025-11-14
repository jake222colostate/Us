import { useCallback, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Buffer } from 'buffer';
import { getSupabaseClient } from '../api/supabase';
import { isTableMissingError, logTableMissingWarning } from '../api/postgrestErrors';
import { POST_PHOTO_BUCKET, type PhotoResource, type ModerationStatus } from '../lib/photos';
import { useAuthStore, selectSession, selectCurrentUser } from '../state/authStore';

const FALLBACK_TYPE = 'image/jpeg';

export type UploadPhotoArgs =
  | { asset: ImagePickerAsset }
  | { uri: string; mimeType?: string | null; width?: number | null; height?: number | null };

export type UploadResult = {
  success: boolean;
  status?: ModerationStatus;
  photo?: PhotoResource;
};

type NormalizedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  width?: number | null;
  height?: number | null;
};

function toBytes(base64: string): Uint8Array {
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
}

function normalizeAsset(input: UploadPhotoArgs): NormalizedAsset {
  if ('asset' in input) {
    const a = input.asset;
    return {
      uri: a.uri,
      mimeType: (a as any).mimeType ?? null,
      fileName: (a as any).fileName ?? a.uri.split('/').pop() ?? null,
      width: a.width ?? null,
      height: a.height ?? null,
    };
  }
  return {
    uri: input.uri,
    mimeType: input.mimeType ?? null,
    fileName: input.uri.split('/').pop() ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
  };
}

function guessContentType(asset: NormalizedAsset): string {
  if (asset.mimeType) return asset.mimeType;
  const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return FALLBACK_TYPE;
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return `image/${extension}`;
}

function ensureUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Crypto.randomUUID();
}

export function usePhotoModeration() {
  const session = useAuthStore(selectSession);
  const user = useAuthStore(selectCurrentUser);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(
    async (input: UploadPhotoArgs): Promise<UploadResult> => {
      if (!session) {
        setError('Sign in to upload photos.');
        return { success: false };
      }

      const asset = normalizeAsset(input);
      if (!asset.uri) {
        setError('Choose a valid photo to upload.');
        return { success: false };
      }

      setIsUploading(true);
      setError(null);

      try {
        const client = getSupabaseClient();
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const bytes = toBytes(base64);
        const contentType = guessContentType(asset);
        const extension = contentType.split('/')[1] || 'jpg';
        const storagePath = `${session.user.id}/${ensureUuid()}.${extension}`;

        const { error: uploadError } = await client.storage
          .from(POST_PHOTO_BUCKET)
          .upload(storagePath, bytes, { contentType, upsert: false });
        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = client.storage.from(POST_PHOTO_BUCKET).getPublicUrl(storagePath);
        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) {
          throw new Error('Unable to resolve uploaded photo URL');
        }

        let status: ModerationStatus = 'pending';
        let photoId: string = storagePath;
        let rejectionReason: string | null = null;

        try {
          const payload: Record<string, unknown> = {
            user_id: session.user.id,
            url: publicUrl,
            storage_path: storagePath,
            status: 'pending',
            content_type: contentType,
            width: asset.width ?? null,
            height: asset.height ?? null,
          };

          const { data: photoRow, error: photoError } = await client
            .from('photos')
            .upsert(payload, { onConflict: 'storage_path' })
            .select('id, status, url, storage_path, content_type, width, height, rejection_reason')
            .maybeSingle();

          if (photoError) {
            if ((photoError as { code?: string }).code === 'PGRST116') {
              status = 'pending';
            } else {
              throw photoError;
            }
          } else if (photoRow) {
            const typed = photoRow as {
              id?: string;
              status?: ModerationStatus;
              url?: string | null;
              storage_path?: string | null;
              content_type?: string | null;
              width?: number | null;
              height?: number | null;
              rejection_reason?: string | null;
            };
            status = typed.status ?? 'pending';
            photoId = typed.id ?? storagePath;
            rejectionReason = typed.rejection_reason ?? null;
          }
        } catch (err) {
          if (isTableMissingError(err, 'photos')) {
            logTableMissingWarning('photos', err);
            status = 'approved';
          } else {
            console.warn('Failed to register photo for moderation', err);
            status = 'approved';
          }
        }

        const photo: PhotoResource = {
          id: photoId,
          storagePath,
          status,
          url: publicUrl,
          contentType,
          width: asset.width ?? null,
          height: asset.height ?? null,
          rejectionReason,
          localUri: asset.uri,
        };

        return {
          success: true,
          status,
          photo,
        };
      } catch (err) {
        console.error(err);
        setError('Upload failed. Try again when you are back online.');
        return { success: false };
      } finally {
        setIsUploading(false);
      }
    },
    [session],
  );

  const noopAsync = useCallback(async () => undefined, []);
  const noop = useCallback(() => undefined, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isUploading,
    isRefreshing: false,
    error,
    uploadPhoto,
    refreshPhoto: noopAsync,
    retryModeration: noopAsync,
    approvePhoto: noopAsync,
    removePhoto: noopAsync,
    loadPhotos: noopAsync,
    clearError,
  };
}


// ========================================
// FIXED fetchPhotoStatus (do not remove)
// ========================================
export async function fetchPhotoStatusFixed(photoId: string | null, storagePath?: string | null) {
  try {
    if (!photoId && !storagePath) {
      console.log("📡 fetchPhotoStatusFixed: no args");
      return null;
    }

    let query = getSupabaseClient()
      .from("photos")
      .select("id,status,storage_path");

    if (photoId) {
      query = query.eq("id", photoId);
    } else if (storagePath) {
      query = query.eq("storage_path", storagePath);
    }

    const { data, error } = await query.maybeSingle();
    console.log("📡 RAW fetchPhotoStatusFixed:", { data, error, photoId, storagePath });

    if (error || !data) return null;

    return {
      id: data.id ?? null,
      status: data.status ?? null,
      storagePath: data.storage_path ?? null,
    };
  } catch (err) {
    console.error("❌ fetchPhotoStatusFixed error", err);
    return null;
  }
}

