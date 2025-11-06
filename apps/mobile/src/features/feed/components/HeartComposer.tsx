import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Text, Button } from '@us/ui';
import type { Post } from '@us/types';
import type { HeartSelfieUpload } from '../api';

export type HeartComposerPayload = {
  message?: string;
  selfie?: HeartSelfieUpload;
};

export type HeartComposerProps = {
  visible: boolean;
  kind: 'normal' | 'big';
  post: Post;
  onClose: () => void;
  onSubmit: (payload: HeartComposerPayload) => void;
  isSending?: boolean;
};

const ensurePermission = async (
  request: () => Promise<ImagePicker.PermissionResponse>,
  onDeniedMessage?: string,
) => {
  const status = await request();
  if (!status.granted) {
    throw new Error(onDeniedMessage ?? 'Permission not granted');
  }
};

export const HeartComposer: React.FC<HeartComposerProps> = ({
  visible,
  kind,
  post,
  onClose,
  onSubmit,
  isSending,
}) => {
  const [message, setMessage] = useState('');
  const [selfie, setSelfie] = useState<HeartSelfieUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!visible) {
      setMessage('');
      setSelfie(null);
      setError(null);
    }
  }, [visible, post.id]);

  const confirmLabel = useMemo(() => (kind === 'big' ? 'Send Big Heart' : 'Send Heart'), [kind]);

  const handlePick = async () => {
    try {
      await ensurePermission(ImagePicker.requestMediaLibraryPermissionsAsync, 'Media library access is required');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setSelfie({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to pick photo');
    }
  };

  const handleCapture = async () => {
    try {
      await ensurePermission(ImagePicker.requestCameraPermissionsAsync, 'Camera access is required');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setSelfie({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open camera');
    }
  };

  const handleSubmit = () => {
    onSubmit({
      message: message.trim() ? message.trim() : undefined,
      selfie: selfie ?? undefined,
    });
  };

  const sheetWidth = useMemo(() => {
    const maxWidth = width >= 960 ? 720 : width - 32;
    return Math.min(maxWidth, 720);
  }, [width]);

  const previewHeight = useMemo(() => {
    const base = Math.min(height * 0.4, 360);
    return Math.max(220, base);
  }, [height]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay} accessibilityRole="dialog" accessibilityLabel="Share a moment with your heart">
        <View style={[styles.sheet, { width: sheetWidth }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text weight="bold" style={styles.title}>
              Personalise your heart
            </Text>
            <Text muted style={styles.subtitle}>
              Add a quick note or selfie so they see you right alongside their moment.
            </Text>
            <View style={[styles.previewGrid, { minHeight: previewHeight }]}>
              <View style={styles.previewCard}>
                <Text weight="semibold" style={styles.previewLabel}>
                  Their photo
                </Text>
                <Image source={{ uri: post.photo_url }} style={styles.previewImage} contentFit="cover" />
              </View>
              <View style={styles.previewCard}>
                <Text weight="semibold" style={styles.previewLabel}>
                  Your selfie
                </Text>
                {selfie ? (
                  <Image source={{ uri: selfie.uri }} style={styles.previewImage} contentFit="cover" />
                ) : (
                  <View style={[styles.previewImage, styles.previewPlaceholder]}>
                    <Text muted style={styles.previewPlaceholderText}>
                      No selfie yet
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.actionsRow}>
              <Button label="Take Selfie" variant="secondary" onPress={handleCapture} style={styles.actionButton} />
              <Button label="Upload Photo" variant="secondary" onPress={handlePick} style={styles.actionButton} />
              {selfie ? (
                <Button
                  label="Remove"
                  variant="ghost"
                  onPress={() => setSelfie(null)}
                  style={styles.actionButton}
                />
              ) : null}
            </View>
            <View style={styles.messageHeader}>
              <Text weight="semibold" style={styles.previewLabel}>
                Message
              </Text>
              <Text muted style={styles.messageHint}>
                Share what drew you in or suggest a spot to meet.
              </Text>
            </View>
            <TextInput
              placeholder="Say something nice..."
              value={message}
              multiline
              onChangeText={setMessage}
              style={styles.input}
              editable={!isSending}
              accessibilityLabel="Heart message"
            />
            {error ? (
              <Text style={styles.error}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button
              label="Cancel"
              variant="ghost"
              onPress={onClose}
              style={styles.footerButton}
              disabled={isSending}
            />
            <Button
              label={confirmLabel}
              onPress={handleSubmit}
              disabled={isSending}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    maxWidth: 720,
    backgroundColor: '#0B0B0F',
    borderRadius: 28,
    overflow: 'hidden',
    maxHeight: '90%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    padding: 28,
    gap: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#D1D1D6',
    lineHeight: 20,
  },
  previewGrid: {
    flexDirection: Platform.select({ web: 'row', default: 'column' }) as 'row' | 'column',
    gap: 20,
  },
  previewCard: {
    flex: 1,
    gap: 10,
  },
  previewLabel: {
    color: '#FFFFFF',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 18,
    backgroundColor: '#1C1C22',
  },
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#3A3A44',
  },
  previewPlaceholderText: {
    color: '#8E8E99',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: Platform.select({ web: 'row', default: 'column' }) as 'row' | 'column',
    gap: 14,
    alignItems: Platform.select({ web: 'center', default: 'stretch' }) as 'center' | 'stretch',
  },
  actionButton: {
    flex: Platform.OS === 'web' ? 1 : undefined,
  },
  messageHeader: {
    gap: 6,
  },
  messageHint: {
    color: '#8E8EA1',
    fontSize: 13,
  },
  input: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D37',
    padding: 16,
    color: '#FFFFFF',
    backgroundColor: '#14141A',
    textAlignVertical: 'top',
  },
  error: {
    color: '#FF5C8A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    backgroundColor: '#050508',
  },
  footerButton: {
    minWidth: 140,
  },
});

