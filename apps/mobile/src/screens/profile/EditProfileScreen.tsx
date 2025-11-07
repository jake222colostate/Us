import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { selectCurrentUser, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Gender, LookingFor } from '@us/types';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useToast } from '../../providers/ToastProvider';
import { useFeedPreferencesStore } from '../../state/feedPreferencesStore';

const BIO_LIMIT = 280;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const user = useAuthStore(selectCurrentUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { show } = useToast();
  const setGenderFilter = useFeedPreferencesStore((state) => state.setGenderFilter);

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [interestsText, setInterestsText] = useState(() => (user?.interests ?? []).join(', '));
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [lookingFor, setLookingFor] = useState<LookingFor>(user?.lookingFor ?? 'everyone');
  const [saving, setSaving] = useState(false);

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
      setGenderFilter(lookingFor);
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
    setGenderFilter,
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
              <View style={styles.toggleGroup}>
                {lookingForOptions.map((option) => {
                  const isActive = lookingFor === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.toggleOption,
                        isActive && styles.toggleOptionActive,
                        pressed && styles.toggleOptionPressed,
                      ]}
                      onPress={() => setLookingFor(option.key)}
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
