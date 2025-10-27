import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';

const createImageSource = (uri: string): ImageSourcePropType => ({ uri });

const matches = [
  {
    id: '1',
    name: 'Sarah',
    age: 26,
    message: "Hey! How's it going?",
    time: '2m ago',
    avatarUri:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: '2',
    name: 'Emma',
    age: 24,
    message: 'Thanks for matching! 😊',
    time: '1h ago',
    avatarUri:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
  },
];

export const MatchesScreen: React.FC = () => (
  <View style={styles.container}>
    <FlatList
      data={matches}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<Header title="Matches" subtitle="Pick up the conversation where you left off" />}
      renderItem={({ item }) => (
        <View style={styles.matchCard}>
          <Avatar source={createImageSource(item.avatarUri)} size={56} />
          <View style={styles.matchDetails}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchName}>{`${item.name}, ${item.age}`}</Text>
              <Text style={styles.matchTime}>{item.time}</Text>
            </View>
            <Text style={styles.matchMessage}>{item.message}</Text>
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  matchDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  matchTime: {
    fontSize: 13,
    color: colors.textMuted,
  },
  matchMessage: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  separator: {
    height: spacing.lg,
  },
});
