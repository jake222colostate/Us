import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useIdentityVerification } from '../../hooks/useIdentityVerification';
import { selectVerificationStatus, useAuthStore } from '../../state/authStore';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const { beginVerification, isLoading, error } = useIdentityVerification();

  const user = useAuthStore((state) => state.user);

  const handleOpenLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionHeader}>Identity verification</Text>
            <Text style={styles.sectionCopy}>
              {statusCopy[verificationStatus] ?? statusCopy.unverified}
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          {isLoading ? <ActivityIndicator color="#f8fafc" /> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={beginVerification}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>
            {verificationStatus === 'verified' ? 'Verified' : 'Verify my identity'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ true: '#a855f7', false: '#1f2937' }}
            thumbColor={darkMode ? '#f8fafc' : '#64748b'}
          />
        </View>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: '#a855f7', false: '#1f2937' }}
            thumbColor={notificationsEnabled ? '#f8fafc' : '#64748b'}
          />
        </View>
        <Text style={styles.sectionCopy}>Notifications are not hooked up yet but will be soon.</Text>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionHeader}>Privacy</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hide profile from discovery</Text>
          <Switch
            value={privacyEnabled}
            onValueChange={setPrivacyEnabled}
            trackColor={{ true: '#a855f7', false: '#1f2937' }}
            thumbColor={privacyEnabled ? '#f8fafc' : '#64748b'}
          />
        </View>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionHeader}>Legal</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleOpenLink('https://example.com/terms')}
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
        >
          <Text style={styles.linkText}>Terms of Service</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleOpenLink('https://example.com/privacy')}
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.metaLabel}>Logged in as</Text>
            <Text style={styles.metaValue}>{user?.email ?? 'Unknown user'}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>App version</Text>
            <Text style={styles.metaValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const statusCopy: Record<string, string> = {
  unverified: 'Verify your identity to unlock photo uploads and advanced filters.',
  pending: 'Your documents are under review. We will notify you once they clear.',
  verified: 'You are verified! Matches will see your badge.',
  rejected: 'Your last verification attempt was rejected. Try again with clearer photos.',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  section: {
    backgroundColor: '#111b2e',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionSpacing: {
    marginTop: 12,
  },
  sectionHeader: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCopy: {
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  errorText: {
    color: '#f87171',
    marginTop: 8,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkRowPressed: {
    opacity: 0.8,
  },
  linkText: {
    color: '#a855f7',
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: '#64748b',
    fontSize: 22,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  metaValue: {
    color: '#e2e8f0',
    fontWeight: '600',
    marginTop: 4,
  },
});
