import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIdentityVerification } from '../../hooks/useIdentityVerification';
import { selectVerificationStatus, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const statusHeadline: Record<string, string> = {
  unverified: 'Help us keep everyone safe',
  pending: 'Verification in review',
  verified: 'You are verified',
  rejected: 'Verification needs another try',
};

const statusDetail: Record<string, string> = {
  unverified: 'We partner with trusted providers to confirm real people join the community.',
  pending: 'Hang tight — our partner is validating your documents. You can keep exploring in the meantime.',
  verified: 'Thanks for verifying. Your badge is visible on your profile and cards.',
  rejected: 'We could not approve the last submission. Make sure your ID is readable and try again.',
};

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyIdentity'>;

export default function VerifyIdentityScreen({ navigation }: Props) {
  const status = useAuthStore(selectVerificationStatus);
  const { beginVerification, isLoading, error } = useIdentityVerification();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.inner}>
        <Text style={styles.title}>{statusHeadline[status] ?? statusHeadline.unverified}</Text>
        <Text style={styles.copy}>{statusDetail[status] ?? statusDetail.unverified}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={beginVerification}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonLabel}>
              {status === 'verified' ? 'Verified' : 'Start verification'}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('MainTabs')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
        >
          <Text style={styles.secondaryButtonLabel}>Continue to the app</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  copy: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    color: '#f87171',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#a855f7',
    borderRadius: 18,
    paddingVertical: 16,
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
  secondaryButton: {
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111b2e',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonLabel: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
});
