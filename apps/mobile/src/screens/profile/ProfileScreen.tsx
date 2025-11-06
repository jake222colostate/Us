import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useNavigation,
  type BottomTabNavigationProp,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectVerificationStatus,
  useAuthStore,
} from '../../state/authStore';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { navigate } from '../../navigation/navigationService';

const formatStatValue = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(value);
};

const getNumericStat = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export default function ProfileScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Profile'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const user = useAuthStore(selectCurrentUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const approvedPhotos = useMemo(
    () =>
      (user?.photos ?? []).filter(
        (photo) => photo?.status === 'approved' && typeof photo?.url === 'string',
      ),
    [user?.photos],
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.emptyContainer} style={styles.screen}>
          <Text style={styles.emptyTitle}>You’re not signed in</Text>
          <Text style={styles.emptyCopy}>Head to the sign in screen to pick up where you left off.</Text>
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => navigate('SignIn')}>
            <Text style={styles.primaryButtonLabel}>Go to sign in</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.emptyContainer} style={styles.screen}>
          <ActivityIndicator color={palette.textPrimary} />
          <Text style={styles.emptyCopy}>Loading your profile…</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const extraStats = user as {
    followers?: number | null;
    followerCount?: number | null;
    following?: number | null;
    followingCount?: number | null;
  };
  const postsCount = approvedPhotos.length;
  const followerCount = getNumericStat(extraStats.followers ?? extraStats.followerCount);
  const followingCount = getNumericStat(extraStats.following ?? extraStats.followingCount);
  const stats = [
    { label: 'Posts', value: postsCount },
    { label: 'Followers', value: followerCount },
    { label: 'Following', value: followingCount },
  ];

  const primaryLine = [user.name ?? 'Your profile', typeof user.age === 'number' ? user.age : null]
    .filter((part) => part !== null && part !== undefined && `${part}`.length > 0)
    .join(', ');

  const metaParts = [user.location ?? null, user.email ?? null].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );
  const meta = metaParts.join(' • ');
  const bioCopy = user.bio?.trim().length ? user.bio.trim() : 'Share a short bio to let others know about you.';
  const interests = user.interests ?? [];
  const interestCopy = interests.length ? interests.join(' • ') : 'Add interests to highlight your vibe.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.username}>{user.email ?? 'Your profile'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            hitSlop={16}
          >
            <Ionicons name="settings-outline" size={22} color={palette.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>No photo</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statBlock}>
                <Text style={styles.statValue}>{formatStatValue(stat.value)}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{primaryLine || 'Your profile'}</Text>
            {verificationStatus === 'verified' ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedLabel}>Verified</Text>
              </View>
            ) : null}
          </View>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.primaryActionLabel}>Edit profile</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
            onPress={() => Alert.alert('Share your profile', 'Sharing is coming soon.')}
          >
            <Text style={styles.secondaryActionLabel}>Share profile</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.sectionCopy}>{bioCopy}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Text style={styles.sectionCopy}>{interestCopy}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoGrid}>
            {approvedPhotos.length ? (
              approvedPhotos.map((photo) => (
                <Image key={photo.id} source={{ uri: photo.url as string }} style={styles.photoTile} />
              ))
            ) : (
              <View style={styles.emptyPhotoTile}>
                <Text style={styles.emptyPhotoLabel}>No photos yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      padding: 20,
      paddingBottom: 48,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    username: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    iconButton: {
      height: 40,
      width: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    iconButtonPressed: {
      opacity: 0.7,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginBottom: 24,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: palette.surface,
    },
    avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarPlaceholderText: {
      color: palette.muted,
      fontWeight: '600',
    },
    statsRow: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    statBlock: {
      alignItems: 'center',
    },
    statValue: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    statLabel: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 4,
    },
    nameSection: {
      marginBottom: 24,
      gap: 6,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    displayName: {
      color: palette.textPrimary,
      fontSize: 24,
      fontWeight: '700',
    },
    verifiedBadge: {
      backgroundColor: palette.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    verifiedLabel: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 12,
    },
    meta: {
      color: palette.muted,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 28,
    },
    primaryAction: {
      flex: 1,
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    primaryActionPressed: {
      opacity: 0.85,
    },
    primaryActionLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
    secondaryAction: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.card,
      paddingVertical: 12,
    },
    secondaryActionPressed: {
      opacity: 0.85,
    },
    secondaryActionLabel: {
      color: palette.textPrimary,
      fontWeight: '700',
    },
    section: {
      marginBottom: 28,
      gap: 12,
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    sectionCopy: {
      color: palette.textSecondary,
      lineHeight: 20,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    photoTile: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    emptyPhotoTile: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
    },
    emptyPhotoLabel: {
      color: palette.muted,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      padding: 24,
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '600',
    },
    emptyCopy: {
      color: palette.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 18,
      alignItems: 'center',
    },
    primaryButtonLabel: {
      color: '#ffffff',
      fontWeight: '700',
    },
  });
