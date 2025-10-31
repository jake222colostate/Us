import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function GoHomeButtonNative() {
  return (
    <Link href="/" asChild>
      <Pressable style={styles.button} accessibilityRole="button">
        <Text style={styles.label}>Go home</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
