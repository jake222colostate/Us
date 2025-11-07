import React, { useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePhotoModeration } from '../../hooks/usePhotoModeration';
import { selectCurrentUser, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useToast } from '../../providers/ToastProvider';

const PLACEHOLDER_BIO = 'Share a short bio so matches know a little about you.';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const user = useAuthStore(selectCurrentUser);
  const { uploadPhoto, isUploading, loadPhotos, removePhoto, error } = usePhotoModeration();
  const { show } = useToast();
  const handledRejections = useRef<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadPhotos().catch((err) => console.warn('Failed to load profile photos', err));
    }, [loadPhotos]),
  );

  React.useEffect(() => {
    if (!user?.photos?.length) {
      return;
    }
    user.photos
      .filter((photo) => photo.status === 'rejected')
      .forEach((photo) => {
        if (!handledRejections.current.has(photo.id)) {
          handledRejections.current.add(photo.id);
          show('A photo was rejected by moderation. Please choose another.');
          removePhoto(photo.id).catch((err) => console.warn('Failed to delete rejected photo', err));
        }
      });
  }, [user?.photos, removePhoto, show]);

  const approvedPhotos = React.useMemo(
    () =>
      (user?.photos ?? []).filter((photo) => photo.status === 'approved' && (photo.url || photo.localUri)),
    [user?.photos],
  );

  const pendingCount = React.useMemo(
    () => (user?.photos ?? []).filter((photo) => photo.status === 'pending').length,
    [user?.photos],
  );

  const displayName = user?.name?.trim().length ? user.name.trim() : 'Your profile';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  const avatarUri = user?.avatar ?? approvedPhotos[0]?.url ?? approvedPhotos[0]?.localUri ?? null;
  const bioCopy = user?.bio?.trim().length ? user.bio.trim() : PLACEHOLDER_BIO;

  const handleSelection = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          show(
            source === 'camera'
              ? 'Camera access is required to take a photo.'
              : 'Media library access is required to pick a photo.',
          );
          return;
        }

        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({ quality: 0.8, exif: true })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsMultipleSelection: false,
                quality: 0.8,
                exif: true,
              });

        if (result.canceled || !result.assets?.length) {
          return;
        }

        const outcome = await uploadPhoto({ asset: result.assets[0] });
        if (!outcome.success) {
          show('Upload failed. Please try again when you have a stable connection.');
          return;
        }

        if (outcome.status === 'approved') {
          show('Photo uploaded! It is now live on your profile.');
        } else if (outcome.status === 'pending') {
          show('Photo uploaded! We will notify you when it is approved.');
        } else {
          show('This photo was rejected by moderation. Try another one.');
        }
      } catch (err) {
        console.error('Photo selection failed', err);
        show('We could not access your photo. Please try again.');
      }
    },
    [show, uploadPhoto],
  );

  const handleAddPhoto = useCallback(() => {
    Alert.alert('Add a photo', 'Choose where to pick your photo from.', [
      { text: 'Camera', onPress: () => handleSelection('camera') },
      { text: 'Library', onPress: () => handleSelection('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleSelection]);

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator color={palette.textPrimary} />
        <Text style={styles.loadingLabel}>Loading your profile…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{initials || '😊'}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.displayName}>{displayName}</Text>
            {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.primaryButtonLabel}>Edit Profile</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleAddPhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={palette.accent} />
            ) : (
              <Text style={styles.secondaryButtonLabel}>Add Photo</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.sectionBody}>{bioCopy}</Text>
        </View>

        {pendingCount > 0 ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              {pendingCount === 1
                ? '1 photo is pending review.'
                : `${pendingCount} photos are pending review.`}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {approvedPhotos.length ? (
            <FlatList
              data={approvedPhotos}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.photoRow}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url ?? item.localUri ?? '' }}
                  style={styles.photo}
                />
              )}
              ListFooterComponent={<View style={styles.photoFooterSpacer} />}
            />
          ) : (
            <Text style={styles.placeholderText}>Add a photo to start building your gallery.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      gap: 12,
    },
    loadingLabel: {
      color: palette.textSecondary,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarPlaceholderText: {
      color: palette.muted,
      fontSize: 24,
      fontWeight: '700',
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    displayName: {
      color: palette.textPrimary,
      fontSize: 24,
      fontWeight: '700',
    },
    email: {
      color: palette.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
    },
    secondaryButtonLabel: {
      color: palette.accent,
      fontWeight: '700',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    errorText: {
      color: palette.danger,
      marginBottom: 16,
    },
    section: {
      marginBottom: 24,
      gap: 8,
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    sectionBody: {
      color: palette.textSecondary,
      lineHeight: 20,
    },
    noticeBox: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 24,
    },
    noticeText: {
      color: palette.textSecondary,
    },
    photoRow: {
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    photo: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 16,
    },
    photoFooterSpacer: {
      height: 8,
    },
    placeholderText: {
      color: palette.muted,
      fontStyle: 'italic',
    },
  });
}

export default ProfileScreen;
