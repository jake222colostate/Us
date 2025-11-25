// Verification screen forces users to complete identity checks before entering the main app.
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIdentityVerification } from '../../hooks/useIdentityVerification';
import { selectVerificationStatus, useAuthStore } from '../../state/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { navigate } from '../../navigation/navigationService';

const statusHeadline: Record<string, string> = {
  unverified: 'Help us keep everyone safe',
  pending: 'Verification in review',
  verified: 'You are verified',
  rejected: 'Verification needs another try',
};

const statusDetail: Record<string, string> = {
  unverified: 'We use your government ID to confirm real people are joining the community.',
  pending: 'Hang tight — we\'re reviewing your ID. You\'ll be able to continue once it\'s approved.',
  verified: 'Thanks for verifying. Your badge is visible on your profile and cards.',
  rejected: 'We could not approve the last submission. Make sure your ID is readable and try again.',
};

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyIdentity'>;

export default function VerifyIdentityScreen(_props: Props) {
  const authStatus = useAuthStore(selectVerificationStatus);
  const {
    beginVerification,
    isLoading,
    error,
    latestVerification,
    refreshVerification,
    currentStatus,
  } = useIdentityVerification();

  const status = currentStatus ?? authStatus ?? 'unverified';

  useEffect(() => {
    // On first mount, pull the latest verification row so we show the photo + status.
    refreshVerification().catch(() => undefined);
  }, [refreshVerification]);

  const effectiveHeadline = statusHeadline[status] ?? statusHeadline.unverified;
  const effectiveDetail = statusDetail[status] ?? statusDetail.unverified;

  const latestStatus = latestVerification?.status ?? null;
  const latestImageUrl = latestVerification?.hostedPath ?? null;
  const latestReason = latestVerification?.reviewerReason ?? null;

  let pillLabel = 'Not started';
  if (latestStatus === 'approved') pillLabel = 'Approved';
  else if (latestStatus === 'pending') pillLabel = 'Pending review';
  else if (latestStatus === 'rejected') pillLabel = 'Rejected';

  const pillStyle = [
    styles.statusPill,
    latestStatus === 'approved'
      ? styles.statusPillApproved
      : latestStatus === 'rejected'
      ? styles.statusPillRejected
      : styles.statusPillPending,
  ];

  const primaryLabel =
    status === 'verified'
      ? 'Verified'
      : status === 'pending'
      ? 'Retake ID photo'
      : status === 'rejected'
      ? 'Try verification again'
      : 'Start verification';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.inner}>
        <Text style={styles.title}>{effectiveHeadline}</Text>
        <Text style={styles.copy}>{effectiveDetail}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {latestVerification && (
          <View style={styles.card}>
            {latestImageUrl ? (
              <Image source={{ uri: latestImageUrl }} style={styles.preview} />
            ) : (
              <View style={[styles.preview, styles.previewPlaceholder]}>
                <Text style={styles.previewPlaceholderText}>ID photo</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Latest ID submission</Text>
                <View style={pillStyle}>
                  <Text style={styles.statusPillText}>{pillLabel}</Text>
                </View>
              </View>
              {latestReason ? (
                <Text style={styles.reasonText}>{latestReason}</Text>
              ) : (
                <Text style={styles.reasonTextMuted}>
                  Make sure the front of your government ID is clear and readable.
                </Text>
              )}
            </View>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={beginVerification}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonLabel}>{primaryLabel}</Text>
          )}
        </Pressable>

        {status === 'verified' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate('MainTabs')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
          >
            <Text style={styles.secondaryButtonLabel}>Continue to the app</Text>
          </Pressable>
        )}
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  preview: {
    width: 110,
    height: 110,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholderText: {
    color: '#64748b',
    fontSize: 12,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  reasonText: {
    color: '#e5e7eb',
    fontSize: 13,
  },
  reasonTextMuted: {
    color: '#9ca3af',
    fontSize: 13,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillPending: {
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
  },
  statusPillApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  statusPillRejected: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
  },
  statusPillText: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
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
