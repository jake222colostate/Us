import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useNavigation,
  type BottomTabNavigationProp,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIdentityVerification } from '../../hooks/useIdentityVerification';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import {
  selectCurrentUser,
  selectVerificationStatus,
  useAuthStore,
} from '../../state/authStore';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';

const toInterestList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const statusCopy: Record<string, string> = {
  unverified: 'Verify your identity to unlock safety features and premium visibility.',
  pending: 'We are reviewing your submission. Come back soon for the result.',
  verified: 'Your identity is verified. Thanks for keeping the community safe!',
  rejected: 'Verification was rejected. Update your info and try again.',
};

export default function ProfileScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Profile'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const user = useAuthStore(selectCurrentUser);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const signOut = useAuthStore((state) => state.signOut);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [bio, setBio] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const {
    status,
    beginVerification,
    refreshStatus: refreshVerification,
    isLoading: verificationLoading,
    error: verificationError,
  } = useIdentityVerification();

  const {
    user: photoUser,
    uploadPhoto,
    refreshPhoto,
    retryModeration,
    removePhoto,
    loadPhotos,
    isUploading,
    isRefreshing,
    error: photoError,
    clearError: clearPhotoError,
  } = usePhotoModeration();

  useEffect(() => {
    setBio(user?.bio ?? '');
    setInterestInput(user?.interests.join(', ') ?? '');
  }, [user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const formattedInterests = useMemo(() => {
    if (!user?.interests?.length) {
      return 'Add interests so matches know what you’re into.';
    }

    return user.interests.join(' • ');
  }, [user?.interests]);

  const handleSave = useCallback(() => {
    updateUser({
      bio: bio.trim(),
      interests: toInterestList(interestInput),
    });
  }, [bio, interestInput, updateUser]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This will eventually remove your profile. For now it’s just a preview.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Understood', style: 'destructive' },
      ],
    );
  }, []);

  const handleAddPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need photo library access to add new photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    await uploadPhoto(result.assets[0].uri);
  }, [uploadPhoto]);

  const handleRefreshPhoto = useCallback(
    async (photoId: string) => {
      clearPhotoError();
      await refreshPhoto(photoId);
    },
    [clearPhotoError, refreshPhoto],
  );

  const handleRetryModeration = useCallback(
    async (photoId: string) => {
      clearPhotoError();
      await retryModeration(photoId);
    },
    [clearPhotoError, retryModeration],
  );

  const photoList = photoUser?.photos ?? [];

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.emptyContainer} style={styles.screen}>
          <Text style={styles.emptyTitle}>You’re not signed in</Text>
          <Text style={styles.emptyCopy}>Head to the sign in screen to pick up where you left off.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Feed')}
          >
            <Text style={styles.primaryButtonLabel}>Go to sign in</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const metaParts = [
    typeof user.age === 'number' ? `${user.age}` : undefined,
    user.location || undefined,
  ].filter(Boolean) as string[];
  const profileMeta = metaParts.length ? metaParts.join(' • ') : 'Add more profile info';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>No photo</Text>
          </View>
        )}
        <View style={styles.headerCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name ?? 'Your profile'}</Text>
            {verificationStatus === 'verified' ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta}>{profileMeta}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsLink}>⚙️ Settings</Text>
        </Pressable>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Identity verification</Text>
          {verificationLoading ? <ActivityIndicator size="small" color="#f8fafc" /> : null}
        </View>
        <Text style={styles.sectionCopy}>{statusCopy[status] ?? statusCopy.unverified}</Text>
        {verificationError ? <Text style={styles.errorText}>{verificationError}</Text> : null}
        <View style={styles.verificationActions}>
          <Pressable
            accessibilityRole="button"
            onPress={beginVerification}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              status === 'verified' && styles.secondaryButtonDisabled,
            ]}
            disabled={verificationLoading}
          >
            <Text style={styles.secondaryButtonLabel}>
              {status === 'verified' ? 'Verified' : status === 'pending' ? 'Verification pending' : 'Verify my identity'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={refreshVerification}
            style={({ pressed }) => [styles.linkButtonSmall, pressed && styles.linkButtonPressed]}
            disabled={verificationLoading}
          >
            <Text style={styles.linkTextSmall}>Refresh status</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {(isUploading || isRefreshing) && <ActivityIndicator size="small" color="#f8fafc" />}
        </View>
        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        <View style={styles.photoGrid}>
          <Pressable
            accessibilityRole="button"
            onPress={handleAddPhoto}
            style={({ pressed }) => [styles.addPhotoCard, pressed && styles.addPhotoCardPressed]}
          >
            {isUploading ? (
              <ActivityIndicator color="#f8fafc" />
            ) : (
              <Text style={styles.addPhotoLabel}>＋ Add photo</Text>
            )}
          </Pressable>
          {photoList.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              {photo.url ? (
                <Image source={{ uri: photo.url }} style={styles.photoPreview} />
              ) : (
                <View style={[styles.photoPreview, styles.photoPreviewPlaceholder]}>
                  <Text style={styles.photoPreviewPlaceholderText}>No photo</Text>
                </View>
              )}
              <View style={styles.photoMetaRow}>
                <View style={[styles.statusBadge, statusStyles[photo.status]]}>
                  <Text style={styles.statusBadgeText}>{statusLabels[photo.status]}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => removePhoto(photo.id)}
                  style={({ pressed }) => [styles.inlineAction, pressed && styles.inlineActionPressed]}
                >
                  <Text style={styles.inlineActionText}>Remove</Text>
                </Pressable>
              </View>
              {photo.status === 'rejected' && photo.rejectionReason ? (
                <Text style={styles.rejectionCopy}>{photo.rejectionReason}</Text>
              ) : null}
              <View style={styles.photoActionsRow}>
                {photo.status === 'rejected' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleRetryModeration(photo.id)}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                  >
                    <Text style={styles.secondaryButtonLabel}>Retry moderation</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleRefreshPhoto(photo.id)}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                  >
                    <Text style={styles.secondaryButtonLabel}>Refresh status</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionTitle}>About</Text>
        <TextInput
          multiline
          value={bio}
          onChangeText={setBio}
          placeholder="Write a short bio that shows your vibe."
          placeholderTextColor="#64748b"
          style={styles.input}
        />
        <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={handleSave}>
          <Text style={styles.secondaryButtonLabel}>Save changes</Text>
        </Pressable>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.sectionCopy}>{formattedInterests}</Text>
        <TextInput
          value={interestInput}
          onChangeText={setInterestInput}
          placeholder="Comma separated interests"
          placeholderTextColor="#64748b"
          style={styles.input}
        />
      </View>

      <View style={[styles.actionsRow, styles.sectionSpacing]}>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={signOut}>
          <Text style={styles.primaryButtonLabel}>Log out</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Text style={styles.dangerLabel}>Delete account (stub)</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const statusLabels: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending review',
  rejected: 'Rejected',
};

const statusStyles = StyleSheet.create({
  approved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  pending: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#fbbf24',
  },
  rejected: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: '#f87171',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2e',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  headerCopy: {
    flex: 1,
    marginHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111b2e',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  avatarPlaceholderText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedBadgeText: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: 12,
  },
  meta: {
    color: '#94a3b8',
    marginTop: 6,
  },
  settingsLink: {
    color: '#a855f7',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#111b2e',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionSpacing: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionCopy: {
    color: '#cbd5f5',
    marginBottom: 12,
    lineHeight: 20,
  },
  verificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    color: '#f8fafc',
    backgroundColor: '#0f172a',
    textAlignVertical: 'top',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  addPhotoCard: {
    width: '48%',
    aspectRatio: 3 / 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoCardPressed: {
    opacity: 0.85,
  },
  addPhotoLabel: {
    color: '#a855f7',
    fontWeight: '700',
  },
  photoCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  photoPreviewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewPlaceholderText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  photoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  inlineAction: {
    padding: 4,
  },
  inlineActionPressed: {
    opacity: 0.7,
  },
  inlineActionText: {
    color: '#f87171',
    fontWeight: '600',
  },
  rejectionCopy: {
    color: '#f87171',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  photoActionsRow: {
    padding: 12,
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonLabel: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  linkButtonSmall: {
    paddingVertical: 8,
  },
  linkButtonPressed: {
    opacity: 0.8,
  },
  linkTextSmall: {
    color: '#a855f7',
    fontWeight: '600',
  },
  actionsRow: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerLabel: {
    color: '#f87171',
    fontWeight: '600',
  },
  errorText: {
    color: '#f87171',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },
  emptyCopy: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 12,
  },
});
