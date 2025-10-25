import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '@us/ui';

export const LegalScreen: React.FC = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Text weight="bold" style={styles.title}>
      Terms & Privacy
    </Text>
    <Text>
      Us is committed to your safety. By using the app you agree to share respectful, authentic content, follow community
      guidelines, and respect others' privacy. We never sell your data and provide clear controls for deleting your account and
      requesting copies of your data. Contact support@us-app.com for any questions.
    </Text>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
  },
});
