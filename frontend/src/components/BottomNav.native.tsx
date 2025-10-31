import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bottomNavRoutes } from '../navigation/routes';

export default function BottomNavNative() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {bottomNavRoutes.map(({ path, label }) => {
        const isActive = pathname === path;
        return (
          <Link key={path} href={path} asChild>
            <Pressable style={[styles.link, isActive && styles.linkActive]} accessibilityRole="button">
              <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  linkActive: {
    backgroundColor: '#dbeafe',
  },
  label: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  labelActive: {
    color: '#2563eb',
  },
});
