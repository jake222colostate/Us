import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { Button, Text } from '@us/ui';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

type FormValues = {
  email: string;
  password: string;
};

export const SignInScreen: React.FC<Props> = () => {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });
  const { signIn } = useAuth();
  const { show } = useToast();

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn({ email, password });
      show('Welcome back');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Unable to sign in');
    }
  });

  return (
    <View style={styles.container}>
      <Text weight="bold" style={styles.title}>
        Welcome back
      </Text>
      <Controller
        control={control}
        name="email"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <TextInput placeholder="Email" value={value} onChangeText={onChange} style={styles.input} keyboardType="email-address" />
        )}
      />
      <Controller
        control={control}
        name="password"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <TextInput placeholder="Password" value={value} onChangeText={onChange} secureTextEntry style={styles.input} />
        )}
      />
      <Button label="Sign In" onPress={onSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E1F0',
    padding: 16,
    backgroundColor: '#fff',
  },
});
