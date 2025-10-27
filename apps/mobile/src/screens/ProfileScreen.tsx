import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const profileImageUri =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=640&q=80';

export const ProfileScreen: React.FC = () => {
  const [distance, setDistance] = React.useState(25);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Your Profile" subtitle="Customize how others see you" />
      <Card style={[styles.profileCard, styles.sectionSpacing]}>
        <View style={styles.profileHeader}>
          <Avatar source={{ uri: profileImageUri }} size={88} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>You, 25</Text>
            <Text style={styles.profileLocation}>San Francisco, CA</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => console.log('Edit profile pressed')}
          style={({ pressed }) => [
            styles.editButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      </Card>

      <Card style={[styles.preferenceCard, styles.sectionSpacing]}>
        <Text style={styles.sectionTitle}>Distance Preference</Text>
        <Text style={styles.sectionSubtitle}>Maximum Distance</Text>
        <Slider
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={distance}
          onValueChange={setDistance}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.primaryMuted}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.distanceValue}>{distance} miles</Text>
        <Text style={styles.preferenceHint}>
          You'll see people within {distance} miles of your location
        </Text>
      </Card>

      <Card style={styles.aboutCard}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.aboutText}>
          Love coffee, hiking, and good conversation. Looking for someone to explore the city with!
        </Text>
      </Card>
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
  sectionSpacing: {
    marginBottom: spacing.xl,
  },
  profileCard: {
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileLocation: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  preferenceCard: {},
  aboutCard: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  preferenceHint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  aboutText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
