import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import type { ModerationStatus } from '../../lib/photos';
import { useToast } from '../../providers/ToastProvider';
import { useThemeStore } from '../../state/themeStore';

const PREVIEW_SIZE = 320;

const PostScreen: React.FC = () => {
  const { uploadPhoto, isUploading } = usePhotoModeration();
  const { show } = useToast();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [hostedUri, setHostedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ModerationStatus | null>(null);
  const [pendingSelection, setPendingSelection] = useState(false);

  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  const handleSelect = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          show(source === 'camera' ? 'Camera access is required to take a photo.' : 'Media library access is required to pick a photo.');
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

        const asset = result.assets[0];
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
        if (outcome.photo?.url) {
          setHostedUri(outcome.photo.url);
        }

        if (finalStatus === 'approved') {
          show('Photo uploaded! It is now live on your profile.');
        } else if (finalStatus === 'pending') {
          show('Photo uploaded! We will notify you when it is approved.');
        } else {
          show('This photo was rejected by moderation. Try another one.');
          setPreviewUri(null);
          setHostedUri(null);
        }
      } catch (err) {
        console.error('Photo selection failed', err);
        show('Something went wrong while selecting your photo. Please try again.');
      }
    },
    [uploadPhoto, show],
  );

  const currentPreview = hostedUri ?? previewUri;
  const showSpinner = isUploading || pendingSelection;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share a new moment</Text>
        <Text style={styles.subtitle}>Capture something now or pull from your camera roll.</Text>
      </View>

      <View style={styles.previewWrapper}>
        {currentPreview ? (
          <Image source={{ uri: currentPreview }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>Select a photo to preview it here.</Text>
          </View>
        )}
        {showSpinner && (
          <View style={styles.previewSpinner}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        {status && !showSpinner && (
          <View style={[styles.badge, status === 'approved' ? styles.badgeApproved : status === 'rejected' ? styles.badgeRejected : styles.badgePending]}>
            <Text style={styles.badgeText}>{status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending review' : 'Rejected'}</Text>
          </View>
        )}
      </View>

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

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
      backgroundColor: background,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: textSecondary,
      lineHeight: 22,
    },
    previewWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    previewImage: {
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      borderRadius: 24,
    },
    previewPlaceholder: {
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: placeholderBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: placeholderBackground,
    },
    previewPlaceholderText: {
      color: placeholderText,
      textAlign: 'center',
      fontSize: 16,
    },
    previewSpinner: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 24,
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
      gap: 16,
    },
    button: {
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
