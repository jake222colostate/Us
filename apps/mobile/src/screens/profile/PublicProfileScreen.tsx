import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { mapPhotoRows, type PhotoRow } from '../../lib/photos';
import { getSupabaseClient } from '../../api/supabase';
import { isTableMissingError, logTableMissingWarning } from '../../api/postgrestErrors';
import { useMatchesStore } from '../../state/matchesStore';
import { useAuthStore, selectSession, selectIsAuthenticated } from '../../state/authStore';
import { likeUser } from '../../api/likes';

export type PublicProfileRoute = RouteProp<RootStackParamList, 'ProfileDetail'>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PublicProfile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  verification_status: string;
};

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
      backgroundColor: palette.surface,
    },
    headerMeta: {
      flex: 1,
    },
    name: {
      color: palette.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    badge: {
      marginTop: 6,
      color: palette.muted,
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
      flexDirection: 'column',
      marginTop: 20,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    secondaryButton: {
      backgroundColor: palette.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
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
    loader: {
      marginTop: 60,
    },
  });

const PublicProfileScreen: React.FC = () => {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const route = useRoute<PublicProfileRoute>();
  const navigation = useNavigation<NavigationProp>();
  const matches = useMatchesStore((state) => state.matches);
  const fetchMatches = useMatchesStore((state) => state.fetchMatches);
  const session = useAuthStore(selectSession);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const { userId } = route.params;

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const client = getSupabaseClient();
        const { data: profileRow, error: profileError } = await client
          .from('profiles')
          .select('id, display_name, bio, verification_status')
          .eq('id', userId)
          .single();
        if (profileError) throw profileError;
        setProfile(profileRow as PublicProfile);
        const { data: photosData, error: photosError } = await client
          .from('photos')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        if (photosError) throw photosError;
        const rows = (photosData ?? []) as PhotoRow[];
        const signed = await mapPhotoRows(rows);
        setPhotos(signed.map((photo) => photo.url).filter((url): url is string => Boolean(url)));
        const { data: quizData, error: quizError } = await client
          .from('quizzes')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();
        if (quizError) {
          if (isTableMissingError(quizError, 'quizzes')) {
            logTableMissingWarning('quizzes', quizError);
            setHasQuiz(false);
          } else {
            throw quizError;
          }
        } else {
          setHasQuiz(Boolean(quizData));
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load this profile.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  const isMatched = matches.some((match) => match.userId === userId);

  const handleSendLike = async () => {
    if (liking) return;
    if (!session || !isAuthenticated) {
      Alert.alert('Sign in required', 'Create an account to send a like.');
      return;
    }

    setLiking(true);
    try {
      const result = await likeUser(session.user.id, userId);
      if (result.matchCreated) {
        await fetchMatches(session.user.id);
        Alert.alert('It’s a match!', 'You both liked each other. Say hi in Matches.');
      } else {
        Alert.alert('Like sent', 'They’ll see your heart in their likes tab.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Unable to send like', 'Please try again in a moment.');
    } finally {
      setLiking(false);
    }
  };

  const handlePrimaryPress = () => {
    if (isMatched) {
      navigation.navigate('MainTabs', { screen: 'Matches' });
      return;
    }
    void handleSendLike();
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.emptyState]}>
        <ActivityIndicator color={palette.accent} style={styles.loader} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, styles.emptyState]}>
        <Text style={styles.emptyTitle}>{error ?? 'Profile unavailable'}</Text>
        <Text style={styles.emptyCopy}>This profile may have been removed or set to private.</Text>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const heroPhoto = photos[0] ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          {heroPhoto ? (
            <Image source={{ uri: heroPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.gridItem]}>
              <Text style={{ color: palette.muted, textAlign: 'center' }}>No photo</Text>
            </View>
          )}
          <View style={styles.headerMeta}>
            <Text style={styles.name}>{profile.display_name ?? 'Member'}</Text>
            <Text style={styles.badge}>Verification: {profile.verification_status}</Text>
          </View>
        </View>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gallery</Text>
        {photos.length ? (
          <View style={styles.grid}>
            {photos.map((uri) => (
              <View key={uri} style={styles.gridItem}>
                <Image source={{ uri }} style={styles.gridImage} />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionCopy}>No approved photos yet.</Text>
        )}
      </View>

      <View style={[styles.section, styles.actionRow]}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            liking && !isMatched && styles.primaryButtonDisabled,
          ]}
          onPress={handlePrimaryPress}
          disabled={liking && !isMatched}
        >
          <Text style={styles.primaryLabel}>
            {isMatched ? 'Send a message' : liking ? 'Sending…' : 'Send like'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.primaryButtonPressed,
            !hasQuiz && styles.primaryButtonDisabled,
          ]}
          onPress={() => navigation.navigate('Quiz', { ownerId: userId })}
          disabled={!hasQuiz}
        >
          <Text style={styles.secondaryLabel}>{hasQuiz ? '🧠 Take My Quiz' : 'Quiz coming soon'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default PublicProfileScreen;
