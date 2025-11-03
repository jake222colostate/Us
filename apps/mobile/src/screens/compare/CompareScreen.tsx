import React, { useMemo } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useComparePreferences, type CompareLayout } from '../../state/comparePreferences';
import type { MainTabParamList } from '../../navigation/RootNavigator';
import { useSampleProfiles } from '../../hooks/useSampleData';

type Props = BottomTabScreenProps<MainTabParamList, 'Compare'>;

type ImageParams = {
  left?: string;
  right?: string;
};

const layoutOptions: { key: CompareLayout; label: string }[] = [
  { key: 'vertical', label: 'Vertical' },
  { key: 'horizontal', label: 'Side by side' },
];

export default function CompareScreen({ route }: Props) {
  const { layout, setLayout } = useComparePreferences();
  const params = (route.params ?? {}) as ImageParams;
  const profiles = useSampleProfiles();

  const [defaultLeft, defaultRight, approvedSet] = useMemo(() => {
    const approved = profiles.flatMap((profile) =>
      profile.photos.filter((photo) => photo.status === 'approved').map((photo) => photo.url),
    );
    if (approved.length === 0) {
      return [undefined, undefined, new Set<string>()] as const;
    }
    if (approved.length === 1) {
      return [approved[0], approved[0], new Set(approved)] as const;
    }
    return [approved[0], approved[1], new Set(approved)] as const;
  }, [profiles]);

  const normalizedLeft = params.left && approvedSet.has(params.left) ? params.left : defaultLeft;
  const normalizedRightCandidate = params.right && approvedSet.has(params.right) ? params.right : defaultRight;
  const left = normalizedLeft;
  const right = normalizedRightCandidate ?? normalizedLeft ?? defaultLeft;

  const isVertical = layout === 'vertical';
  const containerStyle = isVertical ? styles.verticalLayout : styles.horizontalLayout;
  const firstImageStyle = isVertical ? styles.verticalImage : styles.firstHorizontalImage;
  const secondImageStyle = isVertical
    ? [styles.verticalImage, styles.lastVerticalImage]
    : styles.secondHorizontalImage;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.inner}>
        <View style={styles.toggleRow}>
          {layoutOptions.map((option) => {
            const isActive = layout === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setLayout(option.key)}
                style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
              >
                <Text style={[styles.toggleLabel, isActive && styles.toggleLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.compareArea, containerStyle]}>
          {left ? (
            <Image source={{ uri: left }} style={[styles.image, firstImageStyle]} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholder, firstImageStyle]}>
              <Text style={styles.placeholderLabel}>No photo</Text>
            </View>
          )}
          {right ? (
            <Image source={{ uri: right }} style={[styles.image, secondImageStyle]} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholder, secondImageStyle]}>
              <Text style={styles.placeholderLabel}>No photo</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#111b2e',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#a855f7',
  },
  toggleLabel: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#ffffff',
  },
  compareArea: {
    flex: 1,
    backgroundColor: '#111b2e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
  },
  verticalLayout: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 18,
    backgroundColor: '#0f172a',
  },
  verticalImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    marginBottom: 16,
  },
  lastVerticalImage: {
    marginBottom: 0,
  },
  firstHorizontalImage: {
    flex: 1,
    aspectRatio: 3 / 4,
    marginRight: 12,
  },
  secondHorizontalImage: {
    flex: 1,
    aspectRatio: 3 / 4,
    marginLeft: 12,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  placeholderLabel: {
    color: '#64748b',
    fontSize: 16,
  },
});
