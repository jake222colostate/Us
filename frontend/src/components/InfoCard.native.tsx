import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type InfoCardProps = PropsWithChildren<{
  title: string;
  meta?: string;
}>;

export default function InfoCardNative({ title, meta, children }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View>{typeof children === 'string' ? <Text style={styles.body}>{children}</Text> : children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
  },
  body: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
});
