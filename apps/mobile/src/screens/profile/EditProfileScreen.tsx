import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { selectCurrentUser, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useToast } from '../../providers/ToastProvider';

const BIO_LIMIT = 280;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const user = useAuthStore(selectCurrentUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { show } = useToast();

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return displayName.trim() !== (user?.name ?? '') || bio !== (user?.bio ?? '');
  }, [bio, displayName, user?.bio, user?.name]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    if (!displayName.trim().length) {
      show('Display name is required.');
      return;
    }

    setSaving(true);
    try {
      await updateUser({ name: displayName.trim(), bio: bio.trim() });
      show('Profile updated.');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to update profile', err);
      show('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [bio, displayName, navigation, show, updateUser, user]);

  const remaining = BIO_LIMIT - bio.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <View style={styles.content}>
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
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={(text) => {
                if (text.length <= BIO_LIMIT) {
                  setBio(text);
                }
              }}
              placeholder={BIO_LIMIT.toString() + ' characters max'}
              placeholderTextColor={palette.muted}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{remaining} characters left</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled, pressed && styles.saveButtonPressed]}
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
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
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
    counter: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 6,
      textAlign: 'right',
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
