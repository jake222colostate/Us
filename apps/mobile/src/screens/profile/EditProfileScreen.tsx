import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { selectCurrentUser, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Gender, LookingFor } from '@us/types';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useToast } from '../../providers/ToastProvider';
import { getSupabaseClient } from '../../api/supabase';
import { PROFILE_PHOTO_BUCKET } from '../../lib/photos';

const BIO_LIMIT = 280;
const FALLBACK_CONTENT_TYPE = Platform.OS === 'ios' ? 'image/jpeg' : 'image/jpg';

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

function guessContentType(uri: string, mimeType?: string | null): { contentType: string; extension: string } {
  if (mimeType) {
    const extension = mimeType.split('/')[1] || 'jpg';
    return { contentType: mimeType, extension };
  }
  const fileName = uri.split('/').pop() ?? '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) {
    return { contentType: FALLBACK_CONTENT_TYPE, extension: 'jpg' };
  }
  if (extension === 'png') {
    return { contentType: 'image/png', extension: 'png' };
  }
  if (extension === 'webp') {
    return { contentType: 'image/webp', extension: 'webp' };
  }
  if (extension === 'heic' || extension === 'heif') {
    return { contentType: 'image/heic', extension };
  }
  return { contentType: `image/${extension}`, extension };
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const user = useAuthStore(selectCurrentUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setAvatar = useAuthStore((state) => state.setAvatar);
  const { show } = useToast();

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [interestsText, setInterestsText] = useState(() => (user?.interests ?? []).join(', '));
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [lookingFor, setLookingFor] = useState<LookingFor>(user?.lookingFor ?? 'everyone');
  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    setDisplayName(user?.name ?? '');
    setBio(user?.bio ?? '');
    setLocation(user?.location ?? '');
    setInterestsText((user?.interests ?? []).join(', '));
    setGender(user?.gender ?? null);
    setLookingFor(user?.lookingFor ?? 'everyone');
  }, [
    user?.name,
    user?.bio,
    user?.location,
    user?.gender,
    user?.lookingFor,
    JSON.stringify(user?.interests ?? []),
  ]);

  const normalizedInterests = useMemo(
    () =>
      interestsText
        .split(',')
        .map((interest) => interest.trim())
        .filter(Boolean),
    [interestsText],
  );

  const userInterestsKey = useMemo(
    () =>
      (user?.interests ?? [])
        .map((interest) => interest.trim())
        .filter(Boolean)
        .join('|'),
    [user?.interests],
  );

  const currentInterestsKey = useMemo(() => normalizedInterests.join('|'), [normalizedInterests]);

  const displayInitials = useMemo(() => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return '';
    }
    return trimmed
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
  }, [displayName]);

  const avatarUri = user?.avatar ?? null;

  const uploadAvatar = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!user) {
        return;
      }
      const client = getSupabaseClient();
      const previousPath = user.avatarStoragePath ?? null;
      const { contentType, extension } = guessContentType(asset.uri, asset.mimeType ?? null);
      const path = `${user.id}/avatar-${Crypto.randomUUID()}.${extension}`;
      setIsUploadingAvatar(true);
      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const bytes = toBytes(base64);
        const { error: uploadError } = await client.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(path, bytes, { contentType, upsert: true });
        if (uploadError) {
          throw uploadError;
        }
        await setAvatar(path);
        if (previousPath && previousPath !== path) {
          await client.storage.from(PROFILE_PHOTO_BUCKET).remove([previousPath]).catch(() => undefined);
        }
        show('Profile photo updated.');
      } catch (err) {
        console.error('Failed to upload avatar', err);
        show('Unable to update your profile photo. Please try again.');
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [setAvatar, show, user],
  );

  const handleAvatarSelection = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          show(
            source === 'camera'
              ? 'Camera access is required to take a new profile photo.'
              : 'Media library access is required to choose a profile photo.',
          );
          return;
        }

        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                quality: 0.9,
                allowsEditing: true,
                aspect: [3, 4],
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
                quality: 0.9,
                allowsEditing: true,
                aspect: [3, 4],
              });

        if (result.canceled || !result.assets?.length) {
          return;
        }

        const asset = result.assets[0];
        await uploadAvatar(asset);
      } catch (err) {
        console.error('Avatar selection failed', err);
        show('We could not open your camera roll. Please try again.');
      }
    },
    [show, uploadAvatar],
  );

  const handleAvatarPress = useCallback(() => {
    Alert.alert('Update profile photo', 'Choose how you would like to add a new profile picture.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open camera', onPress: () => handleAvatarSelection('camera') },
      { text: 'Choose from library', onPress: () => handleAvatarSelection('library') },
    ]);
  }, [handleAvatarSelection]);

  const hasChanges = useMemo(() => {
    const trimmedName = displayName.trim();
    const trimmedBio = bio;
    const trimmedLocation = location.trim();
    const currentGender = gender ?? null;
    const userGender = user?.gender ?? null;
    const currentLookingFor = lookingFor ?? 'everyone';
    const userLookingFor = user?.lookingFor ?? 'everyone';

    return (
      trimmedName !== (user?.name ?? '') ||
      trimmedBio !== (user?.bio ?? '') ||
      trimmedLocation !== (user?.location ?? '') ||
      currentInterestsKey !== userInterestsKey ||
      currentGender !== userGender ||
      currentLookingFor !== userLookingFor
    );
  }, [
    bio,
    currentInterestsKey,
    displayName,
    gender,
    location,
    lookingFor,
    user?.bio,
    user?.gender,
    user?.location,
    user?.lookingFor,
    userInterestsKey,
  ]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    if (!displayName.trim().length) {
      show('Display name is required.');
      return;
    }

    setSaving(true);
    try {
      const trimmedLocation = location.trim();
      await updateUser({
        name: displayName.trim(),
        bio: bio.trim(),
        location: trimmedLocation.length ? trimmedLocation : null,
        interests: normalizedInterests,
        gender,
        lookingFor,
      });
      show('Profile updated.');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to update profile', err);
      show('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    bio,
    displayName,
    gender,
    location,
    lookingFor,
    navigation,
    normalizedInterests,
    show,
    updateUser,
    user,
  ]);

  const genderOptions = useMemo(
    () =>
      [
        { key: 'woman' as Gender | null, label: 'Woman' },
        { key: 'man' as Gender | null, label: 'Man' },
        { key: 'nonbinary' as Gender | null, label: 'Non-binary' },
        { key: 'other' as Gender | null, label: 'Other' },
        { key: null, label: 'Prefer not to say' },
      ],
    [],
  );

  const lookingForOptions = useMemo(
    () =>
      [
        { key: 'everyone' as LookingFor, label: 'Everyone' },
        { key: 'women' as LookingFor, label: 'Women' },
        { key: 'men' as LookingFor, label: 'Men' },
        { key: 'nonbinary' as LookingFor, label: 'Non-binary' },
      ],
    [],
  );

  const remaining = BIO_LIMIT - bio.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{displayInitials || '😊'}</Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.avatarAddButton,
                    pressed && styles.avatarAddButtonPressed,
                    isUploadingAvatar && styles.avatarAddButtonDisabled,
                  ]}
                  onPress={handleAvatarPress}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="add" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
              <Text style={styles.avatarHint}>Add a clear photo of you to help matches recognise you.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={palette.muted}
                maxLength={60}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City or neighborhood"
                placeholderTextColor={palette.muted}
                autoCapitalize="words"
              />
              <Text style={styles.helper}>Share where you are based so we can surface nearby matches.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>I am</Text>
              <View style={styles.toggleGroup}>
                {genderOptions.map((option) => {
                  const key = option.key ?? 'unspecified';
                  const isActive = gender === option.key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.toggleOption,
                        isActive && styles.toggleOptionActive,
                        pressed && styles.toggleOptionPressed,
                      ]}
                      onPress={() => setGender(option.key)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionLabel,
                          isActive && styles.toggleOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Show me</Text>
              <Text style={styles.helper}>Choose whose posts appear in your feed.</Text>
              <View style={styles.switchList}>
                {lookingForOptions.map((option) => {
                  const isActive = lookingFor === option.key;
                  return (
                    <View key={option.key} style={styles.switchRow}>
                      <Text style={styles.switchLabel}>{option.label}</Text>
                      <Switch
                        value={isActive}
                        onValueChange={(value) => {
                          if (value) {
                            setLookingFor(option.key);
                          } else if (lookingFor === option.key) {
                            setLookingFor('everyone');
                          }
                        }}
                        trackColor={{ true: palette.accent, false: palette.border }}
                        thumbColor={isActive ? '#f8fafc' : palette.muted}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={(text) => {
                  if (text.length <= BIO_LIMIT) {
                    setBio(text);
                  }
                }}
                placeholder={`${BIO_LIMIT} characters max`}
                placeholderTextColor={palette.muted}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{remaining} characters left</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Interests</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={interestsText}
                onChangeText={setInterestsText}
                placeholder="e.g., Hiking, Live music, Coffee shops"
                placeholderTextColor={palette.muted}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.helper}>Separate interests with commas to highlight your favorite things.</Text>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.saveButton,
              (!hasChanges || saving) && styles.saveButtonDisabled,
              pressed && styles.saveButtonPressed,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonLabel}>Save changes</Text>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 120,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
      gap: 12,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarInitials: {
      fontSize: 32,
      fontWeight: '700',
      color: palette.muted,
    },
    avatarAddButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#f472b6',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    avatarAddButtonPressed: {
      opacity: 0.85,
    },
    avatarAddButtonDisabled: {
      opacity: 0.7,
    },
    avatarHint: {
      color: palette.muted,
      fontSize: 13,
      textAlign: 'center',
      paddingHorizontal: 12,
      lineHeight: 18,
    },
    fieldGroup: {
      marginBottom: 24,
    },
    label: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      color: palette.textPrimary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
    },
    bioInput: {
      minHeight: 140,
    },
    multilineInput: {
      minHeight: 96,
    },
    counter: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 6,
      textAlign: 'right',
    },
    helper: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
    },
    switchList: {
      marginTop: 12,
      gap: 16,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchLabel: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    toggleGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    toggleOption: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    toggleOptionActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    toggleOptionPressed: {
      opacity: 0.85,
    },
    toggleOptionLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
    },
    toggleOptionLabelActive: {
      color: '#ffffff',
    },
    saveButton: {
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 14,
      backgroundColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonPressed: {
      opacity: 0.85,
    },
    saveButtonLabel: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}

export default EditProfileScreen;
