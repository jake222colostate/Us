import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import { getSupabaseClient } from '../../api/supabase';

type RootNavigation = import('@react-navigation/native-stack').NativeStackNavigationProp<
  import('../../navigation/RootNavigator').RootStackParamList
>;

function computeBirthdayFromAge(ageInput?: string): string | null {
  if (!ageInput) return null;
  const numericAge = Number(ageInput);
  if (!Number.isFinite(numericAge) || numericAge <= 0) {
    return null;
  }
  const now = new Date();
  const birthYear = now.getUTCFullYear() - Math.floor(numericAge);
  const birthDate = new Date(Date.UTC(birthYear, now.getUTCMonth(), now.getUTCDate()));
  return birthDate.toISOString().slice(0, 10);
}

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setSubmitting(true);
    try {
      const client = getSupabaseClient();
      const normalizedEmail = email.trim().toLowerCase();
      const displayName = name.trim() || normalizedEmail.split('@')[0] || 'New member';
      const parsedInterests =
        interests
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean) ?? [];
      const birthday = computeBirthdayFromAge(age);

      console.log('🆕 Signing up with Supabase', { email: normalizedEmail });
      const { data, error: signUpError } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      if (signUpError) {
        throw signUpError;
      }

      const userId = data.user?.id ?? data.session?.user.id;
      if (userId) {
        await client
          .from('profiles')
          .upsert({
            id: userId,
            display_name: displayName,
            bio: bio.trim() || null,
            interests: parsedInterests,
            location: location.trim() || null,
            birthday,
          }, { onConflict: 'id' });
      }

      const parentNav = navigation.getParent<RootNavigation>();
      if (data.session) {
        parentNav?.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        setInfoMessage('Account created! Check your email to confirm before signing in.');
      }
    } catch (err) {
      console.error(err);
      const message = (err as Error)?.message ?? 'Unable to create your account right now.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join the community and start matching.</Text>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Create a strong password"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.inlineRow}>
            <View style={[styles.inlineField, styles.inlineFieldLeft]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="27"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell people a little about you"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Interests</Text>
            <TextInput
              style={styles.input}
              value={interests}
              onChangeText={setInterests}
              placeholder="Comma separated interests"
              placeholderTextColor="#64748b"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || submitting) && styles.primaryButtonPressed,
            ]}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonLabel}>Create account</Text>
          </Pressable>
          {submitting ? <ActivityIndicator style={styles.loadingIndicator} color="#a855f7" /> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('SignIn')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#111b2e',
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inlineRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  inlineField: {
    flex: 1,
  },
  inlineFieldLeft: {
    marginRight: 16,
  },
  label: {
    color: '#e2e8f0',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    color: '#f8fafc',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#f87171',
    marginBottom: 12,
    fontWeight: '500',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#a855f7',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  infoText: {
    marginTop: 8,
    color: '#38bdf8',
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#a855f7',
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 12,
  },
});
