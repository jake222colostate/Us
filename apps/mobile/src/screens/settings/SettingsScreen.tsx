import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseClient } from '../../api/supabase';
import { useIdentityVerification } from '../../hooks/useIdentityVerification';
import { selectVerificationStatus, useAuthStore } from '../../state/authStore';
import { useThemeStore } from '../../state/themeStore';
import { useAppTheme, type AppPalette } from '../../theme/palette';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setDarkMode = useThemeStore((state) => state.setDarkMode);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);

  const verificationStatus = useAuthStore(selectVerificationStatus);
  const { beginVerification, isLoading, error } = useIdentityVerification();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      const client = getSupabaseClient();
      await client.auth.signOut();
    } catch (err) {
      console.error('Failed to sign out from Supabase', err);
    } finally {
      try {
        const store = useAuthStore.getState();
        if (typeof store.signOut === 'function') {
          store.signOut();
        }
      } catch (e) {
        console.warn('Auth store signOut not available', e);
      }
    }
  };

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

      {/* Identity verification */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionHeader}>Identity verification</Text>
            <Text style={styles.sectionCopy}>
              {statusCopy[verificationStatus] ?? statusCopy.unverified}
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          {isLoading ? <ActivityIndicator color={palette.textPrimary} /> : null}
        </View>

        {verificationStatus !== 'verified' && (
          <Pressable
            accessibilityRole="button"
            onPress={beginVerification}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonLabel}>Verify my identity</Text>
          </Pressable>
        )}
      </View>

      {/* Appearance */}
      <View style={[styles.section, styles.sectionSpacing]}>
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ true: palette.accent, false: palette.border }}
            thumbColor={isDarkMode ? '#f8fafc' : palette.muted}
          />
        </View>
      </View>

      {/* Notifications */}
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
        <Text style={styles.sectionCopy}>
          Notifications are not hooked up yet but will be soon.
        </Text>
      </View>

      {/* Privacy */}
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

      {/* Legal */}
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

      {/* About */}
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

      {/* Logout */}
      <Pressable
        accessibilityRole="button"
        onPress={handleLogout}
        style={({ pressed }) => [
          {
            marginTop: 24,
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: '#ef4444',
            alignItems: 'center',
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const statusCopy: Record<string, string> = {
  unverified: 'Verify your identity to unlock photo uploads and advanced filters.',
  pending: 'Your documents are under review. We will notify you once they clear.',
  verified: 'You are verified! Matches will see your badge.',
  rejected: 'Your last verification attempt was rejected. Try again with clearer photos.',
};

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      padding: 20,
      paddingBottom: 60,
      gap: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    section: {
      backgroundColor: palette.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
    },
    sectionSpacing: {
      marginTop: 12,
    },
    sectionHeader: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    sectionCopy: {
      color: palette.muted,
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
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    button: {
      marginTop: 16,
      backgroundColor: palette.surface,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
    },
    errorText: {
      color: palette.danger,
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
      color: palette.accent,
      fontSize: 16,
      fontWeight: '600',
    },
    chevron: {
      color: palette.muted,
      fontSize: 22,
    },
    metaLabel: {
      color: palette.muted,
      fontSize: 13,
    },
    metaValue: {
      color: palette.textPrimary,
      fontWeight: '600',
      marginTop: 4,
    },
  });
