import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { Button, Text } from '@us/ui';
import DateTimePicker from '@react-native-community/datetimepicker';

const years18 = 18 * 365.25 * 24 * 60 * 60 * 1000;

type Props = NativeStackScreenProps<AuthStackParamList, 'AgeGate'>;

type FormValues = {
  birthdate: Date;
};

export const AgeGateScreen: React.FC<Props> = ({ navigation }) => {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      birthdate: new Date(Date.now() - years18),
    },
  });

  const birthdate = watch('birthdate');
  const isOfAge = Date.now() - birthdate.getTime() >= years18;

  const onSubmit = handleSubmit(() => {
    if (isOfAge) {
      navigation.navigate('SignUp', {
        birthdate: birthdate.toISOString().slice(0, 10),
      } as never);
    }
  });

  return (
    <View style={styles.container}>
      <Text weight="bold" style={styles.title}>
        You must be 18+ to use Us
      </Text>
      <Controller
        control={control}
        name="birthdate"
        render={({ field: { value, onChange } }) => (
          <DateTimePicker value={value} mode="date" display="spinner" onChange={(_, date) => date && onChange(date)} />
        )}
      />
      <Button label="Continue" onPress={onSubmit} disabled={!isOfAge} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
});
