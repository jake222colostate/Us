import React from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button, Text } from '@us/ui';
import { useAuth } from '../../providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile } from '../../features/profile/api';
import { supabase } from '../../api/supabase';

export const EditProfileScreen: React.FC = () => {
  const { session } = useAuth();
  const client = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => (session ? fetchProfile(session.user.id) : Promise.resolve(null)),
  });

  const { control, handleSubmit } = useForm({
    defaultValues: {
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: { display_name: string; bio: string }) => {
      if (!session) return;
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: values.display_name, bio: values.bio })
        .eq('user_id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['profile', session?.user.id] }),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text weight="bold" style={styles.title}>
        Edit profile
      </Text>
      <Controller
        control={control}
        name="display_name"
        render={({ field: { value, onChange } }) => (
          <TextInput value={value} onChangeText={onChange} placeholder="Name" style={styles.input} />
        )}
      />
      <Controller
        control={control}
        name="bio"
        render={({ field: { value, onChange } }) => (
          <TextInput value={value} onChangeText={onChange} placeholder="Bio" style={[styles.input, styles.textArea]} multiline />
        )}
      />
      <Button label={mutation.isPending ? 'Saving...' : 'Save'} onPress={onSubmit} />
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
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E1F0',
    padding: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
  },
});
