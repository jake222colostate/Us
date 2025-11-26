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
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { selectCurrentUser, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Gender, LookingFor } from '@us/types';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useToast } from '../../providers/ToastProvider';
import { usePhotoModeration, fetchPhotoStatusFixed } from '../../hooks/usePhotoModeration';
import type { ModerationStatus } from '../../lib/photos';

const BIO_LIMIT = 280;

const MAX_INTERESTS = 10;

const INTEREST_CATEGORIES: { title: string; items: string[] }[] = [
  { title: 'Outdoors', items: ['Hiking', 'Camping', 'Running', 'Skiing', 'Beach walks'] },
  { title: 'Creative', items: ['Music', 'Singing', 'Art', 'Photography', 'Writing'] },
  { title: 'Lifestyle', items: ['Coffee', 'Brunch', 'Cooking', 'Travel', 'Reading'] },
  { title: 'Fitness', items: ['Gym', 'Yoga', 'Pilates', 'Team sports', 'Cycling'] },
  { title: 'Fun', items: ['Gaming', 'Movies', 'Board games', 'Karaoke', 'Bar nights'] },
];

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const user = useAuthStore(selectCurrentUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setAvatar = useAuthStore((state) => state.setAvatar);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const { show } = useToast();
  const { uploadPhoto } = usePhotoModeration();

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [interestsText, setInterestsText] = useState(() => (user?.interests ?? []).join(', '));
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [lookingFor, setLookingFor] = useState<LookingFor>(user?.lookingFor ?? 'everyone');
  const [saving, setSaving] = useState(false);

  // Avatar moderation state
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(user?.avatarStoragePath ?? null);
  const [avatarStatus, setAvatarStatus] = useState<ModerationStatus | null>(null);
  const [avatarSelectionStartedAt, setAvatarSelectionStartedAt] = useState<number | null>(null);

  useEffect(() => {
    setDisplayName(user?.name ?? '');
    setBio(user?.bio ?? '');
    setLocation(user?.location ?? '');
    setInterestsText((user?.interests ?? []).join(', '));
    setGender(user?.gender ?? null);
    setLookingFor(user?.lookingFor ?? 'everyone');
    setAvatarPath(user?.avatarStoragePath ?? null);
    setAvatarPreviewUri(null);
  }, [
    user?.name,
    user?.bio,
    user?.location,
    user?.gender,
    user?.lookingFor,
    JSON.stringify(user?.interests ?? []),
    user?.avatarStoragePath,
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

  const [selectedInterests, setSelectedInterests] = useState<string[]>(normalizedInterests);
  const [interestPickerVisible, setInterestPickerVisible] = useState(false);

  useEffect(() => {
    setSelectedInterests(normalizedInterests);
  }, [currentInterestsKey]);

  const handleToggleInterest = useCallback(
    (item: string) => {
      setSelectedInterests(prev => {
        if (prev.includes(item)) {
          const next = prev.filter(x => x !== item);
          setInterestsText(next.join(', '));
          return next;
        }
        if (prev.length >= MAX_INTERESTS) {
          show(`You can choose up to ${MAX_INTERESTS} interests.`);
          return prev;
        }
        const next = [...prev, item];
        setInterestsText(next.join(', '));
        return next;
      });
    },
    [show],
  );

  const openInterestsPicker = useCallback(() => {
    Keyboard.dismiss();
    setSelectedInterests(normalizedInterests);
    setInterestPickerVisible(true);
  }, [normalizedInterests]);

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

  const avatarUri = avatarPreviewUri ?? user?.avatar ?? null;

  // Poll avatar moderation status for the current avatarPath
  useEffect(() => {
    let cancelled = false;
    if (!avatarPath) return;

    const tick = async () => {
      const res = await fetchPhotoStatusFixed(null, avatarPath);
      if (!res || cancelled) return;

      const raw = (res.status ?? 'pending').toString().toLowerCase().trim();
      let normalized: ModerationStatus =
        raw === 'approved' ? 'approved' : raw === 'rejected' ? 'rejected' : 'pending';

      // For the first 10s after selecting a new avatar, suppress early 'rejected' flashes.
      if (
        normalized === 'rejected' &&
        avatarSelectionStartedAt &&
        Date.now() - avatarSelectionStartedAt < 10000
      ) {
        normalized = 'pending';
      }

      if (normalized !== avatarStatus) {
        setAvatarStatus(normalized);
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [avatarPath, avatarStatus, avatarSelectionStartedAt]);

  const renderAvatarStatus = () => {
    if (!avatarPath && !avatarStatus) return null;

    const status = avatarStatus ?? 'pending';
    let color = '#fbbf24';
    let label = 'Pending moderation…';

    if (status === 'approved') {
      color = '#10b981';
      label = 'Approved';
    } else if (status === 'rejected') {
      color = '#ef4444';
      label = 'Rejected';
    }

    return (
      <Text style={{ marginTop: 8, color }}>
        {label}
      </Text>
    );
  };

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

        // Local preview
        setAvatarPreviewUri(asset.uri);
        setAvatarStatus('pending');
        setAvatarPath(null);
        setAvatarSelectionStartedAt(Date.now());

        // Upload via shared moderation pipeline
        const uploadRes = await uploadPhoto({ asset }, { kind: 'avatar' });
        if (uploadRes.success && uploadRes.photo) {
          setAvatarPath(uploadRes.photo.storagePath ?? null);
          setAvatarStatus(uploadRes.status ?? 'pending');
        } else {
          show('We could not upload your photo. Please try again.');
        }
      } catch (err) {
        console.error('Avatar selection failed', err);
        show('We could not open your camera roll. Please try again.');
      }
    },
    [show, uploadPhoto],
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

    // If avatar is in-flight and not approved, block save
    if (avatarStatus && avatarStatus !== 'approved') {
      show('Your new profile photo must be approved before saving.');
      return;
    }

    setSaving(true);
    try {
      const trimmedLocation = location.trim();

      // Apply profile field changes
      await updateUser({
        name: displayName.trim(),
        bio: bio.trim(),
        location: trimmedLocation.length ? trimmedLocation : null,
        interests: normalizedInterests,
        gender,
        lookingFor,
      });

      // If we have a newly approved avatarPath that differs from stored one, persist it
      if (avatarPath && avatarStatus === 'approved' && avatarPath !== user.avatarStoragePath) {
        await setAvatar(avatarPath);
      }

      await refreshProfile();
      show('Profile updated.');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to update profile', err);
      show('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    avatarPath,
    avatarStatus,
    bio,
    displayName,
    gender,
    location,
    lookingFor,
    navigation,
    normalizedInterests,
    refreshProfile,
    setAvatar,
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
  const avatarChanged = !!(avatarPath && avatarPath !== (user?.avatarStoragePath ?? null));
  const disabledSave =
    saving ||
    (!hasChanges && !avatarChanged) ||
    (avatarChanged && avatarStatus !== 'approved');

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
                    saving && styles.avatarAddButtonDisabled,
                  ]}
                  onPress={handleAvatarPress}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={18} color="#fff" />
                  )}
                </Pressable>
              </View>
              {renderAvatarStatus()}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Bio</Text>
                <Text style={styles.counter}>{remaining}</Text>
              </View>
              <TextInput
                style={styles.textArea}
                value={bio}
                onChangeText={(text) => text.length <= BIO_LIMIT && setBio(text)}
                placeholder="Tell people about yourself"
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
                placeholderTextColor="#9CA3AF"
              />
            </View>

                        <View style={styles.section}>
              <Text style={styles.label}>Interests</Text>
              <Pressable
                onPress={openInterestsPicker}
                style={({ pressed }) => [
                  styles.input,
                  pressed && styles.inputPressed,
                ]}
              >
                <Text
                  style={styles.interestsValue}
                  numberOfLines={1}
                >
                  {interestsText.length ? interestsText : 'Tap to choose your interests'}
                </Text>
              </Pressable>
            </View>


            <View style={styles.section}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pillRow}>
                {genderOptions.map((opt) => (
                  <Pressable
                    key={String(opt.key)}
                    onPress={() => setGender(opt.key)}
                    style={[
                      styles.pill,
                      gender === opt.key && styles.pillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        gender === opt.key && styles.pillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Looking for</Text>
              <View style={styles.pillRow}>
                {lookingForOptions.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setLookingFor(opt.key)}
                    style={[
                      styles.pill,
                      lookingFor === opt.key && styles.pillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        lookingFor === opt.key && styles.pillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>


                        <Modal
              visible={interestPickerVisible}
              animationType="slide"
              onRequestClose={() => setInterestPickerVisible(false)}
            >
              <SafeAreaView style={styles.interestsModalSafeArea} edges={['top']}>
                <View style={styles.interestsModalHeader}>
                  <View style={styles.interestsHeaderRow}>
                    <Pressable
                      onPress={() => setInterestPickerVisible(false)}
                      style={({ pressed }) => pressed && { opacity: 0.7 }}
                    >
                      <Text style={styles.interestsHeaderAction}>✕</Text>
                    </Pressable>
                    <Text style={styles.interestsModalTitle}>Interests</Text>
                    <Pressable
                      onPress={() => setInterestPickerVisible(false)}
                      style={({ pressed }) => pressed && { opacity: 0.7 }}
                    >
                      <Text style={styles.interestsHeaderAction}>Done</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.interestsModalSubtitle}>
                    {selectedInterests.length} of {MAX_INTERESTS}
                  </Text>
                  {selectedInterests.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.interestsSelectedScroller}
                    >
                      {selectedInterests.map((interest) => (
                        <View
                          key={interest}
                          style={[
                            styles.interestChip,
                            styles.interestChipActive,
                            styles.interestsSelectedChip,
                          ]}
                        >
                          <Text
                            style={[
                              styles.interestChipLabel,
                              styles.interestChipLabelActive,
                            ]}
                          >
                            {interest}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
                <ScrollView
                  contentContainerStyle={styles.interestsModalContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {INTEREST_CATEGORIES.map((category) => (
                    <View key={category.title} style={styles.interestsCategory}>
                      <Text style={styles.interestsCategoryTitle}>{category.title}</Text>
                      <View style={styles.interestsChipsRow}>
                        {category.items.map((item) => {
                          const active = selectedInterests.includes(item);
                          return (
                            <Pressable
                              key={item}
                              onPress={() => handleToggleInterest(item)}
                              style={[
                                styles.interestChip,
                                active && styles.interestChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.interestChipLabel,
                                  active && styles.interestChipLabelActive,
                                ]}
                              >
                                {item}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </SafeAreaView>
            </Modal>

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  disabledSave && styles.saveButtonDisabled,
                  pressed && !disabledSave && styles.saveButtonPressed,
                ]}
                disabled={disabledSave}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

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
      paddingTop: 16,
      paddingBottom: 32,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarWrapper: {
      width: 132,
      height: 132,
      borderRadius: 999,
      backgroundColor: '#020617',
      borderWidth: 2,
      borderColor: '#111827',
      overflow: 'visible',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
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
      backgroundColor: '#111827',
    },
    avatarInitials: {
      fontSize: 32,
      fontWeight: '700',
      color: '#F9FAFB',
    },
    avatarAddButton: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#EC4899',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#020617',
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    avatarAddButtonPressed: {
      opacity: 0.7,
    },
    avatarAddButtonDisabled: {
      opacity: 0.5,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 6,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    counter: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#374151',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: '#F9FAFB',
      backgroundColor: '#020617',
    },
    textArea: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#374151',
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 80,
      fontSize: 15,
      color: '#F9FAFB',
      backgroundColor: '#020617',
      textAlignVertical: 'top',
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#4B5563',
      backgroundColor: '#020617',
    },
    pillActive: {
      backgroundColor: '#EC4899',
      borderColor: '#EC4899',
    },
    pillText: {
      fontSize: 13,
      color: '#E5E7EB',
    },
    pillTextActive: {
      color: '#0B1120',
      fontWeight: '600',
    },

    inputPressed: {
      opacity: 0.9,
    },
    interestsValue: {
      fontSize: 15,
      color: palette.textPrimary,
    },
    footer: {
      marginTop: 12,
    },
    saveButton: {
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EC4899',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonPressed: {
      opacity: 0.8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0B1120',
    },
  });
}
