import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useMatchesStore } from '../../state/matchesStore';
import { useAuthStore, selectSession, selectIsAuthenticated } from '../../state/authStore';
import { useToast } from '../../providers/ToastProvider';

export default function MatchesScreen() {
  const session = useAuthStore(selectSession);
  const matches = useMatchesStore((state) => state.matches);
  const fetchMatches = useMatchesStore((state) => state.fetchMatches);
  const isLoading = useMatchesStore((state) => state.isLoading);
  const error = useMatchesStore((state) => state.error);
  const clearMatches = useMatchesStore((state) => state.clear);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { show } = useToast();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Matches'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  useEffect(() => {
    if (!session || !isAuthenticated) {
      clearMatches();
      return;
    }
    console.log('🎯 Loading matches for user', session.user.id);
    fetchMatches(session.user.id).catch((err) => {
      console.error('Matches fetch failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      show(`Unable to load matches: ${message}`);
    });
  }, [session, isAuthenticated, fetchMatches, show, clearMatches]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.matchId}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Matches</Text>
            <Text style={styles.subtitle}>We only surface mutual likes. Say hi and keep it kind.</Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.loader} color={palette.accent} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyCopy}>Start liking profiles to see your mutual connections here.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name ?? 'this match'}'s profile`}
              onPress={() => navigation.navigate('ProfileDetail', { userId: item.userId })}
              style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>No photo</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${item.name ?? 'this match'}`}
              onPress={() =>
                navigation.navigate('Chat', {
                  matchId: item.matchId,
                  userId: item.userId,
                  name: item.name ?? 'Member',
                  avatar: item.avatar ?? null,
                  createdAt: item.createdAt,
                })
              }
              style={({ pressed }) => [styles.chatButton, pressed && styles.chatButtonPressed]}
            >
              <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{item.name ?? 'Member'}</Text>
                <Text style={styles.matchMeta}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.matchMessage}>{item.bio ?? 'No bio yet.'}</Text>
              </View>
            </Pressable>
          </View>
        )}
        ListFooterComponent={error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.footerSpacing} />}
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingBottom: 32,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 14,
    },
    matchCard: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: palette.card,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    },
    profileButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: palette.card,
    },
    profileButtonPressed: {
      backgroundColor: palette.surface,
    },
    chatButton: {
      flex: 4,
      paddingVertical: 16,
      paddingRight: 16,
      paddingLeft: 12,
      justifyContent: 'center',
      backgroundColor: palette.card,
    },
    chatButtonPressed: {
      backgroundColor: palette.surface,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: palette.surface,
    },
    avatarPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    avatarPlaceholderText: {
      color: palette.muted,
      fontSize: 10,
      fontWeight: '600',
    },
    matchInfo: {
      flex: 1,
      gap: 6,
    },
    matchName: {
      fontSize: 18,
      color: palette.textPrimary,
      fontWeight: '600',
    },
    matchMeta: {
      color: palette.muted,
      fontSize: 13,
    },
    matchMessage: {
      color: palette.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    errorText: {
      color: palette.danger,
      textAlign: 'center',
      marginTop: 16,
    },
    emptyState: {
      marginTop: 120,
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
    },
    emptyCopy: {
      color: palette.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
    loader: {
      marginTop: 48,
    },
    footerSpacing: {
      height: 32,
    },
  });
