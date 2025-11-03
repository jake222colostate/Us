import React, { useState } from 'react';
import {
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

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) {
      return;
    }
    setSubmitted(true);
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
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter the email associated with your account and we&apos;ll send reset instructions.
        </Text>

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
              editable={!submitted}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            disabled={submitted}
          >
            <Text style={styles.primaryButtonLabel}>
              {submitted ? 'Check your inbox' : 'Send reset link'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Back to sign in</Text>
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
    paddingTop: 60,
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
    marginTop: 32,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  fieldGroup: {
    marginBottom: 18,
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
  primaryButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
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
