import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { Button, Text } from '@us/ui';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

type FormValues = {
  email: string;
  password: string;
};

export const SignUpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { birthdate } = route.params ?? { birthdate: new Date().toISOString().slice(0, 10) };
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { email: '', password: '' } });
  const { signUp } = useAuth();
  const { show } = useToast();

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signUp({ email, password, birthdate });
      show('Confirm your email to finish sign up');
      navigation.navigate('SignIn');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Unable to sign up');
    }
  });

  return (
    <View style={styles.container}>
      <Text weight="bold" style={styles.title}>
        Create your account
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
        rules={{ required: true, minLength: 6 }}
        render={({ field: { value, onChange } }) => (
          <TextInput placeholder="Password" value={value} onChangeText={onChange} secureTextEntry style={styles.input} />
        )}
      />
      <Button label="Sign Up" onPress={onSubmit} />
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
