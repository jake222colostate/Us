// Sign-in screen now routes authenticated users through verification gating before the main app.
import React, { useEffect, useState } from 'react';
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
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import { getSupabaseClient } from '../../api/supabase';
import { navigate, navigationRef } from '../../navigation/navigationService';
import { selectIsAuthenticated, selectVerificationStatus, useAuthStore } from '../../state/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const verificationStatus = useAuthStore(selectVerificationStatus);

  useEffect(() => {
    if (!isAuthenticated) return;
    const targetRoute = verificationStatus === 'verified' ? 'MainTabs' : 'VerifyIdentity';
    if (!navigationRef.isReady()) {
      setTimeout(() => navigate(targetRoute), 0);
      return;
    }
    const routeNames = navigationRef.getRootState()?.routeNames;
    if (routeNames && !routeNames.includes(targetRoute)) {
      // The tree might still be the auth stack; wait for the swap on the next tick.
      setTimeout(() => navigate(targetRoute), 0);
      return;
    }
    navigate(targetRoute);
  }, [isAuthenticated, verificationStatus]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const client = getSupabaseClient();
      const normalizedEmail = email.trim().toLowerCase();
      console.log('🔐 Signing in with Supabase', { email: normalizedEmail });
      const { error: signInError } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      console.error(err);
      const message = (err as Error)?.message ?? 'Something went wrong signing you in.';
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
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/usimage.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>Us</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to keep exploring the feed.</Text>
        </View>

        <View style={styles.card}>
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
              placeholder="••••••••"
              placeholderTextColor="#64748b"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.inlineLink}
          >
            <Text style={styles.inlineLinkText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || submitting) && styles.primaryButtonPressed,
            ]}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonLabel}>Sign In</Text>
          </Pressable>
          {submitting ? <ActivityIndicator style={styles.loadingIndicator} color="#a855f7" /> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Need an account? Create one</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#a855f7',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: '#fdf8ff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: '#2f0c4d',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#7c699b',
    fontSize: 15,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    marginTop: 32,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5def6',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#2f0c4d',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5def6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f4e6ff',
    color: '#2f0c4d',
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
  loadingIndicator: {
    marginTop: 12,
  },
  inlineLink: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  inlineLinkText: {
    color: '#a855f7',
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
});
