import React, { useMemo, useCallback } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View, Pressable, Text } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useSampleProfiles } from '../../hooks/useSampleData';
import { useConnectionsStore } from '../../state/connectionsStore';
import { useAppTheme, type AppPalette } from '../../theme/palette';

export type PublicProfileRoute = RouteProp<RootStackParamList, 'ProfileDetail'>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingBottom: 48,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
      backgroundColor: palette.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      marginRight: 16,
    },
    headerMeta: {
      flex: 1,
    },
    name: {
      color: palette.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: 16,
      justifyContent: 'space-around',
    },
    statBlock: {
      alignItems: 'center',
    },
    statValue: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 18,
    },
    statLabel: {
      color: palette.muted,
      marginTop: 4,
      fontSize: 12,
    },
    bio: {
      marginTop: 16,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
      gap: 8,
      marginTop: 24,
    },
    gridItem: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: palette.surface,
      position: 'relative',
    },
    gridImage: {
      width: '100%',
      height: '100%',
    },
    lockOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    lockLabel: {
      color: palette.textPrimary,
      fontWeight: '700',
      textAlign: 'center',
    },
    section: {
      paddingHorizontal: 20,
      marginTop: 24,
      gap: 12,
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 18,
    },
    sectionCopy: {
      color: palette.muted,
      lineHeight: 20,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
      flexWrap: 'wrap',
    },
    primaryButton: {
      flex: 1,
      backgroundColor: palette.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: palette.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryLabel: {
      color: '#fff',
      fontWeight: '700',
    },
    secondaryLabel: {
      color: palette.textPrimary,
      fontWeight: '600',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    emptyCopy: {
      color: palette.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

const UNLOCK_PRICE = '$4.99';

const PublicProfileScreen: React.FC = () => {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const route = useRoute<PublicProfileRoute>();
  const navigation = useNavigation<NavigationProp>();
  const profiles = useSampleProfiles();
  const { userId } = route.params;

  const profile = useMemo(() => profiles.find((item) => item.id === userId), [profiles, userId]);
  const isAccessible = useConnectionsStore((state) => state.isProfileAccessible(userId));
  const isMatched = useConnectionsStore((state) => state.isMatched(userId));
  const unlockProfile = useConnectionsStore((state) => state.unlockProfile);
  const addMatch = useConnectionsStore((state) => state.addMatch);
  const unmatch = useConnectionsStore((state) => state.unmatch);

  const approvedPhotos = useMemo(
    () =>
      (profile?.photos ?? []).filter((photo) => photo.status === 'approved' && photo.url).map((photo) => photo.url),
    [profile?.photos],
  );

  const handleUnlock = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      'Unlock profile',
      `Unlock ${profile.name}'s full profile for ${UNLOCK_PRICE}?`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Unlock',
          style: 'default',
          onPress: () => unlockProfile(profile.id),
        },
      ],
    );
  }, [profile, unlockProfile]);

  const handleMatch = useCallback(() => {
    if (!profile) return;
    if (isMatched) {
      Alert.alert('Already matched', `You and ${profile.name} are already connected.`);
      return;
    }
    addMatch(profile);
    Alert.alert('Match confirmed', `You and ${profile.name} now have full access to each other.`);
  }, [addMatch, isMatched, profile]);

  const handleUnmatch = useCallback(() => {
    if (!profile) return;
    Alert.alert('Unmatch', `Remove ${profile.name} from your matches?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unmatch',
        style: 'destructive',
        onPress: () => {
          unmatch(profile.id);
          navigation.goBack();
        },
      },
    ]);
  }, [navigation, profile, unmatch]);

  if (!profile) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.emptyState}>
        <Text style={styles.emptyTitle}>Profile not found</Text>
        <Text style={styles.emptyCopy}>This person may have left the feed.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.headerMeta}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{approvedPhotos.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{isMatched ? '✔︎' : '—'}</Text>
            <Text style={styles.statLabel}>Match</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile.distanceMi} mi</Text>
            <Text style={styles.statLabel}>Away</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gallery</Text>
        <View style={styles.grid}>
          {approvedPhotos.map((url) => (
            <View key={url} style={styles.gridItem}>
              <Image source={{ uri: url }} style={styles.gridImage} />
              {!isAccessible ? (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockLabel}>Unlock to view this post</Text>
                </View>
              ) : null}
            </View>
          ))}
          {approvedPhotos.length === 0 ? (
            <View style={[styles.gridItem, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.lockLabel}>No approved photos yet</Text>
            </View>
          ) : null}
        </View>
      </View>

      {!isAccessible ? (
        <View style={styles.section}>
          <Text style={styles.sectionCopy}>
            Send a match request or unlock their profile to see the full gallery and story highlights.
          </Text>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={handleUnlock}>
              <Text style={styles.primaryLabel}>Unlock profile • {UNLOCK_PRICE}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={handleMatch}>
              <Text style={styles.secondaryLabel}>Send match request</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionCopy}>
            You have full access to this profile. Say hi and keep the vibe going!
          </Text>
          {!isMatched ? (
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={handleMatch}
              >
                <Text style={styles.secondaryLabel}>Send match request</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      {isMatched ? (
        <View style={styles.section}>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={handleUnmatch}>
              <Text style={styles.secondaryLabel}>Unmatch</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

export default PublicProfileScreen;
