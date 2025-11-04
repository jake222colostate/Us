import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../navigation/RootNavigator';
import { useConnectionsStore } from '../../state/connectionsStore';
import { useAppTheme, type AppPalette } from '../../theme/palette';

export default function MatchesScreen() {
  const matches = useConnectionsStore((state) => state.matches);
  const unmatch = useConnectionsStore((state) => state.unmatch);
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Matches'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={matches.filter((item) =>
          (item.photos ?? []).some((photo) => photo?.status === 'approved' && photo?.url),
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Matches</Text>
            <Text style={styles.subtitle}>Everyone here already liked you back.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyCopy}>Keep exploring the feed — we’ll drop your matches here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ProfileDetail', { userId: item.id })}
            style={({ pressed }) => [styles.matchCard, pressed && styles.matchCardPressed]}
          >
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>No photo</Text>
              </View>
            )}
            <View style={styles.matchInfo}>
              <Text style={styles.matchName}>
                {item.name}
                <Text style={styles.matchPercent}> • {item.matchPercent}% match</Text>
              </Text>
              <Text style={styles.matchMeta}>{item.lastActive}</Text>
              <Text style={styles.matchMessage}>{item.lastMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  event.stopPropagation();
                  unmatch(item.id);
                }}
                style={({ pressed }) => [styles.unmatchButton, pressed && styles.unmatchButtonPressed]}
              >
                <Text style={styles.unmatchLabel}>Unmatch</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
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
      alignItems: 'center',
      backgroundColor: palette.card,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.border,
    },
    matchCardPressed: {
      opacity: 0.85,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      marginRight: 16,
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
    matchPercent: {
      fontSize: 16,
      color: palette.accent,
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
    unmatchButton: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
    },
    unmatchButtonPressed: {
      opacity: 0.8,
    },
    unmatchLabel: {
      color: palette.danger,
      fontWeight: '600',
      fontSize: 12,
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
  });
