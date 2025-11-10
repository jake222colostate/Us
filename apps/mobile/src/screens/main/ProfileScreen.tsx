import React from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { Avatar, Button, Text } from '@us/ui';
import { useAuth } from '../../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile, fetchProfilePosts } from '../../features/profile/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen: React.FC = () => {
  const { session, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => (session ? fetchProfile(session.user.id) : Promise.resolve(null)),
  });
  const { data: posts = [] } = useQuery({
    queryKey: ['profile-posts', session?.user.id],
    queryFn: () => (session ? fetchProfilePosts(session.user.id) : Promise.resolve([])),
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profile?.photo_urls?.[0]} label={profile?.display_name} size={92} />
        <Text weight="bold" style={styles.name}>
          {profile?.display_name ?? 'Your profile'}
        </Text>
        <Text muted>{profile?.bio ?? 'Share your story with the community.'}</Text>
        <View style={styles.buttonRow}>
          <Button label="Edit" variant="secondary" onPress={() => navigation.navigate('EditProfile')} />
          <Button label="Settings" variant="ghost" onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>
      <Text weight="bold" style={styles.sectionTitle}>
        Photos
      </Text>
      <View style={styles.grid}>
        {posts.map((post) => (
          <Image key={post.id} source={{ uri: post.photo_url ?? '' }} style={styles.gridImage} />
        ))}
      </View>
      <Button label="View Legal" variant="ghost" onPress={() => navigation.navigate('Legal')} />
      <Button label="Delete account" variant="secondary" onPress={() => navigation.navigate('AccountDeletion')} />
      <Button label="Sign out" variant="ghost" onPress={() => signOut()} />
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
});
