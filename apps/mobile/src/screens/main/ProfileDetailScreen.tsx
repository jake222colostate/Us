import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, View, Image } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, fetchProfilePosts, blockUser, reportUser } from '../../features/profile/api';
import { Avatar, Button, Text } from '@us/ui';
import { useAuth } from '../../providers/AuthProvider';

export const ProfileDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<ProfileStackParamList, 'ProfileDetail'>>();
  const { userId } = route.params;
  const { data: profile } = useQuery({ queryKey: ['profile', userId], queryFn: () => fetchProfile(userId) });
  const { data: posts = [] } = useQuery({ queryKey: ['profile-posts', userId], queryFn: () => fetchProfilePosts(userId) });
  const { session } = useAuth();
  const client = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: () => blockUser({ blocker: session?.user.id ?? '', blocked: userId }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert('Blocked', 'This user has been blocked.');
    },
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) => reportUser({ reporter: session?.user.id ?? '', reportedUser: userId, reason }),
    onSuccess: () => Alert.alert('Reported', 'Thank you for keeping Us safe.'),
  });

  const onReport = useCallback(() => {
    Alert.alert('Report user', 'Choose a reason', [
      { text: 'Spam', onPress: () => reportMutation.mutate('spam') },
      { text: 'Harassment', onPress: () => reportMutation.mutate('harassment') },
      { text: 'Inappropriate content', onPress: () => reportMutation.mutate('inappropriate') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [reportMutation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profile?.photo_urls?.[0]} label={profile?.display_name} size={92} />
        <Text weight="bold" style={styles.name}>
          {profile?.display_name ?? 'Profile'}
        </Text>
        <Text muted>{profile?.bio}</Text>
      </View>
      <Text weight="bold" style={styles.sectionTitle}>
        Photos
      </Text>
      <View style={styles.grid}>
        {posts.map((post) => (
          <Image key={post.id} source={{ uri: post.photo_url }} style={styles.gridImage} />
        ))}
      </View>
      <View style={styles.actions}>
        <Button label="Block" variant="secondary" onPress={() => blockMutation.mutate()} />
        <Button label="Report" variant="ghost" onPress={onReport} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridImage: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
