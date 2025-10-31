import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScreenContainerProps } from './ScreenContainer';

export default function ScreenContainerNative({ title, subtitle, children }: ScreenContainerProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.content}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
  },
});
