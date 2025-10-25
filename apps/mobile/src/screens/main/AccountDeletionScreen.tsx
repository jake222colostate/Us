import React from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from '@us/ui';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../api/supabase';

export const AccountDeletionScreen: React.FC = () => {
  const { session, signOut } = useAuth();

  const onDelete = async () => {
    if (!session) return;
    Alert.alert('Delete account', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('profiles').delete().eq('user_id', session.user.id);
          await supabase.from('posts').delete().eq('user_id', session.user.id);
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text weight="bold" style={styles.title}>
        Delete account
      </Text>
      <Text>
        Deleting your account removes your profile, posts, and device tokens immediately. Purchase receipts remain for tax
        compliance. You can also email privacy@us-app.com to request a data export prior to deletion.
      </Text>
      <Button label="Delete account" variant="secondary" onPress={onDelete} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
  },
});
