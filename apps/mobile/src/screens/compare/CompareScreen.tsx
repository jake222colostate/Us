import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useComparePreferences, type CompareLayout } from '../../state/comparePreferences';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useSampleProfiles } from '../../hooks/useSampleData';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

const layoutOptions: { key: CompareLayout; label: string }[] = [
  { key: 'vertical', label: 'Vertical' },
  { key: 'horizontal', label: 'Side by side' },
];

export default function CompareScreen({ route }: Props) {
  const { layout, setLayout } = useComparePreferences();
  const params = route.params ?? {};
  const profiles = useSampleProfiles();

  const fallbackPhotos = useMemo(() => {
    const firstWithPhotos = profiles.find((profile) =>
      (profile.photos ?? []).some((photo) => photo?.status === 'approved' && photo?.url),
    );
    if (!firstWithPhotos) {
      return [] as string[];
    }

    return (firstWithPhotos.photos ?? [])
      .filter((photo) => photo?.status === 'approved' && photo?.url)
      .map((photo) => photo.url);
  }, [profiles]);

  const profilePhotos = useMemo(() => {
    const providedPhotos = params.profile?.photos ?? [];
    return providedPhotos
      .filter((photo) => photo?.status === 'approved' && photo?.url)
      .map((photo) => photo.url as string);
  }, [params.profile?.photos]);

  const firstFallback = profilePhotos[0] ?? params.leftPhoto ?? fallbackPhotos[0] ?? null;
  const secondFallback =
    profilePhotos[1] ?? params.rightPhoto ?? profilePhotos[0] ?? fallbackPhotos[1] ?? firstFallback;

  const left = params.leftPhoto ?? firstFallback;
  const right = params.rightPhoto ?? secondFallback;

  const profileName = params.profile?.name ?? 'This profile';
  const verificationStatus = params.profile?.verification?.status;
  const profileBio = params.profile?.bio;

  const isVertical = layout === 'vertical';
  const containerStyle = isVertical ? styles.verticalLayout : styles.horizontalLayout;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Compare photos</Text>
          <Text style={styles.subtitle}>{profileName}</Text>
          <Text style={styles.verificationLabel}>
            {verificationStatus ? `Verification: ${verificationStatus}` : 'Not verified yet'}
          </Text>
          {profileBio ? <Text style={styles.bio}>{profileBio}</Text> : null}
        </View>

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
          <View style={[styles.photoCard, isVertical ? styles.verticalPhotoCard : styles.firstHorizontalPhoto]}> 
            {left ? (
              <Image source={{ uri: left }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.placeholder]}>
                <Text style={styles.placeholderLabel}>No photo</Text>
              </View>
            )}
          </View>
          <View style={[styles.photoCard, isVertical ? styles.verticalPhotoCard : styles.secondHorizontalPhoto]}>
            {right ? (
              <Image source={{ uri: right }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.placeholder]}>
                <Text style={styles.placeholderLabel}>No photo</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonLabel}>Send Like</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => {
              // TODO: Hook into feed data source to advance to the next profile.
            }}
          >
            <Text style={styles.secondaryButtonLabel}>Next profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#cbd5f5',
    fontSize: 18,
    fontWeight: '600',
  },
  verificationLabel: {
    color: '#94a3b8',
    marginTop: 4,
  },
  bio: {
    color: '#cbd5f5',
    marginTop: 12,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#111b2e',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
    marginHorizontal: 16,
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
    backgroundColor: '#111b2e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  verticalLayout: {
    flexDirection: 'column',
  },
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  verticalPhotoCard: {
    width: '100%',
    marginBottom: 16,
  },
  firstHorizontalPhoto: {
    width: '48%',
  },
  secondHorizontalPhoto: {
    width: '48%',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLabel: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#a855f7',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryButtonLabel: {
    color: '#cbd5f5',
    fontWeight: '600',
    fontSize: 14,
  },
});
