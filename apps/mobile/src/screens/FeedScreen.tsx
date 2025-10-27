import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Header';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { TabParamList } from '../navigation/Tabs';
import type { RootStackParamList } from '../navigation/RootNavigator';

const createImageSource = (uri: string): ImageSourcePropType => ({ uri });

type FeedScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Feed'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const profiles = [
  {
    id: '1',
    name: 'Sarah',
    age: 26,
    distance: '3 miles away',
    imageUri:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    avatarUri:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
    bio: 'Sarah living her best life ✨',
  },
  {
    id: '2',
    name: 'Emma',
    age: 24,
    distance: '5 miles away',
    imageUri:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
    avatarUri:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
    bio: 'Capturing the moment and chasing sunsets 🌅',
  },
];

const viewerProfile = {
  name: 'You',
  imageUri:
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=640&q=80',
};

export const FeedScreen: React.FC = () => {
  const navigation = useNavigation<FeedScreenNavigationProp>();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Discover" subtitle="See who is nearby and ready to connect" />
      {profiles.map((profile) => (
        <Card key={profile.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.name}>{`${profile.name}, ${profile.age}`}</Text>
              <View style={styles.metaRow}>
                <Ionicons
                  style={styles.metaIcon}
                  name="location-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{profile.distance}</Text>
              </View>
            </View>
            <Avatar source={createImageSource(profile.avatarUri)} size={56} />
          </View>
          <Image
            source={createImageSource(profile.imageUri)}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.actionsRow}>
            <View style={[styles.actionChip, styles.actionChipSpacing]}>
              <Ionicons name="heart" size={16} color={colors.primary} />
              <Text style={styles.actionText}>1.2k</Text>
            </View>
            <View style={styles.actionChip}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.actionText}>3m</Text>
            </View>
          </View>
          <Text style={styles.bio}>{profile.bio}</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.cta,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() =>
              navigation.navigate('ComparePhotos', {
                viewerName: viewerProfile.name,
                viewerImageUri: viewerProfile.imageUri,
                profileName: profile.name,
                profileImageUri: profile.imageUri,
              })
            }
          >
            <Ionicons style={styles.ctaIcon} name="images-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Compare Photos Side by Side</Text>
          </Pressable>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaIcon: {
    marginRight: spacing.xs,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  image: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 999,
  },
  actionChipSpacing: {
    marginRight: spacing.sm,
  },
  actionText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  ctaIcon: {
    marginRight: spacing.sm,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
