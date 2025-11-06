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
  selectIsPremium,
  selectIsAuthenticated,
  useAuthStore,
} from '../../state/authStore';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { usePostQuotaStore } from '../../state/postQuotaStore';
import { getSupabaseClient } from '../../api/supabase';
import { navigate } from '../../navigation/navigationService';

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
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isPremium = useAuthStore(selectIsPremium);
  const setPremium = useAuthStore((state) => state.setPremium);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const statusStyles = useMemo(() => createStatusStyles(palette), [palette]);
  const postedToday = usePostQuotaStore((state) => state.postedToday);
  const resetQuota = usePostQuotaStore((state) => state.resetIfNeeded);
  const dailyLimit = isPremium ? 20 : 3;
  const remainingPosts = Math.max(dailyLimit - postedToday, 0);

  const [bio, setBio] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    console.log('[profile] authed?', isAuthenticated);
  }, [isAuthenticated]);

  const {
    status,
    beginVerification,
    refreshStatus: refreshVerification,
    isLoading: verificationLoading,
    error: verificationError,
  } = useIdentityVerification();
  const verificationMode = process.env.EXPO_PUBLIC_VERIFICATION_MODE || 'mock';

  const {
    user: photoUser,
    uploadPhoto,
    refreshPhoto,
    retryModeration,
    approvePhoto,
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

  useEffect(() => {
    resetQuota();
  }, [resetQuota]);

  const formattedInterests = useMemo(() => {
    if (!user?.interests?.length) {
      return 'Add interests so matches know what you’re into.';
    }

    return user.interests.join(' • ');
  }, [user?.interests]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateUser({
        bio: bio.trim(),
        interests: toInterestList(interestInput),
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Unable to save', 'Please try again once you have a stable connection.');
    } finally {
      setSaving(false);
    }
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
      mediaTypes: ['images'],
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.emptyContainer} style={styles.screen}>
          <Text style={styles.emptyTitle}>You’re not signed in</Text>
          <Text style={styles.emptyCopy}>Head to the sign in screen to pick up where you left off.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => navigate('SignIn')}
          >
            <Text style={styles.primaryButtonLabel}>Go to sign in</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.emptyContainer} style={styles.screen}>
          <ActivityIndicator color={palette.textPrimary} />
          <Text style={styles.emptyCopy}>Loading your profile…</Text>
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
          {verificationLoading ? <ActivityIndicator size="small" color={palette.textPrimary} /> : null}
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
          {(isUploading || isRefreshing) && <ActivityIndicator size="small" color={palette.textPrimary} />}
        </View>
        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
        <Text style={styles.quotaCopy}>
          {`You've shared ${postedToday} of ${dailyLimit} photos today${
            remainingPosts > 0 ? ` • ${remainingPosts} remaining` : ''
          }.`}
        </Text>
        {!isPremium ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setPremium(true)}
            style={({ pressed }) => [styles.premiumButton, pressed && styles.premiumButtonPressed]}
          >
            <Text style={styles.premiumButtonLabel}>Upgrade to Premium for 20 daily posts</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setPremium(false)}
            style={({ pressed }) => [styles.premiumManageButton, pressed && styles.premiumManageButtonPressed]}
          >
            <Text style={styles.premiumManageLabel}>Premium active • Tap to switch plans</Text>
          </Pressable>
        )}
        <View style={styles.photoGrid}>
          <Pressable
            accessibilityRole="button"
            onPress={handleAddPhoto}
            style={({ pressed }) => [styles.addPhotoCard, pressed && styles.addPhotoCardPressed]}
          >
            {isUploading ? (
              <ActivityIndicator color={palette.textPrimary} />
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
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRefreshPhoto(photo.id)}
                      style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                    >
                      <Text style={styles.secondaryButtonLabel}>Refresh status</Text>
                    </Pressable>
                    {verificationMode === 'mock' && photo.status === 'pending' ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => approvePhoto(photo.id)}
                        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                      >
                        <Text style={styles.secondaryButtonLabel}>Approve (mock)</Text>
                      </Pressable>
                    ) : null}
                  </>
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
          placeholderTextColor={palette.muted}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonLabel}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.sectionCopy}>{formattedInterests}</Text>
        <TextInput
          value={interestInput}
          onChangeText={setInterestInput}
          placeholder="Comma separated interests"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />
      </View>

      <View style={[styles.actionsRow, styles.sectionSpacing]}>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.primaryButtonLabel}>{signingOut ? 'Signing out…' : 'Log out'}</Text>
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

const createStatusStyles = (palette: AppPalette) =>
  StyleSheet.create({
    approved: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      borderColor: palette.success,
    },
    pending: {
      backgroundColor: 'rgba(234, 179, 8, 0.15)',
      borderColor: palette.accent,
    },
    rejected: {
      backgroundColor: 'rgba(248, 113, 113, 0.15)',
      borderColor: palette.danger,
    },
  });

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      padding: 20,
      paddingBottom: 60,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
    },
    headerCopy: {
      flex: 1,
      marginHorizontal: 16,
      gap: 6,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: palette.surface,
    },
    avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarPlaceholderText: {
      color: palette.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    name: {
      color: palette.textPrimary,
      fontSize: 24,
      fontWeight: '700',
    },
    verifiedBadge: {
      backgroundColor: palette.accent,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    verifiedBadgeText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 12,
    },
    meta: {
      color: palette.muted,
    },
    settingsLink: {
      color: palette.accent,
      fontWeight: '600',
    },
    section: {
      backgroundColor: palette.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
      marginTop: 16,
    },
    sectionSpacing: {
      marginTop: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    sectionCopy: {
      color: palette.muted,
      marginTop: 8,
      lineHeight: 18,
    },
    quotaCopy: {
      color: palette.muted,
      marginTop: 12,
      lineHeight: 18,
    },
    premiumButton: {
      marginTop: 12,
      backgroundColor: palette.accent,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
    },
    premiumButtonPressed: {
      opacity: 0.9,
    },
    premiumButtonLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
    premiumManageButton: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    premiumManageButtonPressed: {
      opacity: 0.85,
    },
    premiumManageLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
      fontSize: 12,
    },
    errorText: {
      color: palette.danger,
      marginTop: 8,
      fontWeight: '600',
    },
    verificationActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: palette.surface,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    secondaryButtonPressed: {
      opacity: 0.9,
    },
    secondaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButtonLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
    },
    linkButtonSmall: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    linkButtonPressed: {
      opacity: 0.7,
    },
    linkTextSmall: {
      color: palette.accent,
      fontWeight: '600',
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 16,
    },
    addPhotoCard: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 18,
      borderStyle: 'dashed',
      borderWidth: 2,
      borderColor: palette.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    addPhotoCardPressed: {
      opacity: 0.9,
    },
    addPhotoLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
    },
    photoCard: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    photoPreview: {
      width: '100%',
      height: '100%',
    },
    photoPreviewPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    photoPreviewPlaceholderText: {
      color: palette.muted,
      fontWeight: '600',
    },
    photoMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: palette.background,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    statusBadgeText: {
      color: palette.textPrimary,
      fontWeight: '600',
      fontSize: 12,
    },
    inlineAction: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
    },
    inlineActionPressed: {
      opacity: 0.85,
    },
    inlineActionText: {
      color: palette.accent,
      fontWeight: '600',
    },
    rejectionCopy: {
      color: palette.danger,
      paddingHorizontal: 12,
      paddingBottom: 12,
      fontWeight: '600',
    },
    photoActionsRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    input: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 16,
      backgroundColor: palette.surface,
      color: palette.textPrimary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: palette.accent,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
    },
    primaryButtonLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
    dangerButton: {
      flex: 1,
      backgroundColor: palette.danger,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
    },
    dangerLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      padding: 24,
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '600',
    },
    emptyCopy: {
      color: palette.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const client = getSupabaseClient();
      await client.auth.signOut();
    } catch (err) {
      console.error(err);
      Alert.alert('Unable to sign out', 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  }, []);

