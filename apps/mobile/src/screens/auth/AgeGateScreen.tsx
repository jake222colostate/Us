import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const today = new Date();
const adultCutoff = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate()
);

const ageSchema = z.object({
  birthdate: z
    .date({ required_error: 'Please select your birth date' })
    .max(adultCutoff, 'You must be at least 18 to continue'),
});

type AgeGateFormValues = z.infer<typeof ageSchema>;

const isWeb = Platform.OS === 'web';

export const AgeGateScreen: React.FC = () => {
  const { control, handleSubmit, formState } = useForm<AgeGateFormValues>({
    resolver: zodResolver(ageSchema),
    defaultValues: {
      birthdate: new Date(2000, 0, 1),
    },
  });

  const onSubmit = (values: AgeGateFormValues) => {
    console.log('Age gate accepted', values);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Age Check" subtitle="We ask everyone to confirm they are 18 or older" />
      <View style={[styles.cardContainer, styles.formCard]}>
        <Text style={styles.label}>Date of birth</Text>
        <Controller<AgeGateFormValues>
          control={control}
          name="birthdate"
          render={({ field: { value, onChange } }) => (
            <View>
              {isWeb ? (
                <TextInput
                  style={styles.input}
                  value={value.toISOString().slice(0, 10)}
                  onChangeText={(text) => {
                    const next = new Date(text);
                    if (!Number.isNaN(next.getTime())) {
                      onChange(next);
                    }
                  }}
                  accessibilityLabel="Birthdate"
                />
              ) : (
                <DateTimePicker
                  value={value}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={adultCutoff}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      onChange(selectedDate);
                    }
                  }}
                  style={styles.datePicker}
                />
              )}
              <Text style={styles.helperText}>You must be at least 18 years old.</Text>
            </View>
          )}
        />
        {formState.errors.birthdate ? (
          <Text style={styles.errorText}>{formState.errors.birthdate.message}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submitButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitText}>Continue</Text>
        </Pressable>
      </View>
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
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#00000033',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  formCard: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: '#fff',
  },
  datePicker: {
    width: '100%',
  },
  helperText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  errorText: {
    marginTop: spacing.xs,
    color: '#E63946',
    fontSize: 13,
  },
  submitButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 999,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
