import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useComparePreferences, type CompareLayout } from '../../state/comparePreferences';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { mapPhotoRows, type PhotoRow } from '../../lib/photos';
import { getSupabaseClient } from '../../api/supabase';

const layoutOptions: { key: CompareLayout; label: string }[] = [
  { key: 'horizontal', label: 'Side by side' },
  { key: 'vertical', label: 'Vertical' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

export default function CompareScreen({ route, navigation }: Props) {
  const { layout, setLayout } = useComparePreferences();
  const params = route.params ?? {};
  const [approvedPhotos, setApprovedPhotos] = useState<string[]>([]);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!params.profile?.id) {
        setApprovedPhotos([]);
        return;
      }
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('photos')
          .select('*')
          .eq('user_id', params.profile.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const rows = (data ?? []) as PhotoRow[];
        const signed = await mapPhotoRows(rows);
        setApprovedPhotos(signed.map((photo) => photo.url).filter((url): url is string => Boolean(url)));
      } catch (err) {
        console.error('Failed to load comparison photos', err);
        setApprovedPhotos([]);
      }
    };
    loadPhotos();
  }, [params.profile?.id]);

  const handleNextProfile = useCallback(async () => {
    const context = params.context;
    if (!context || !context.items?.length) {
      navigation.goBack();
      return;
    }

    const nextIndex = (context.index + 1) % context.items.length;
    const target = context.items[nextIndex];
    if (!target) {
      navigation.goBack();
      return;
    }

    setIsLoadingNext(true);
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name, bio, verification_status')
        .eq('id', target.userId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const row = data ?? null;
      const nextProfile = row
        ? {
            id: (row.id as string) ?? target.userId,
            name: (row.display_name as string | null) ?? undefined,
            bio: (row.bio as string | null) ?? undefined,
            verification: {
              status: (row.verification_status as string | null) ?? null,
            },
          }
        : { id: target.userId };

      let nextLeftPhoto: string | null = null;
      if (context.type === 'live') {
        nextLeftPhoto = target.livePhotoUrl ?? null;
        if (!nextLeftPhoto) {
          const { data: liveData, error: liveError } = await client
            .from('live_posts')
            .select('photo_url')
            .eq('user_id', target.userId)
            .order('live_started_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!liveError) {
            nextLeftPhoto = (liveData?.photo_url as string | null) ?? null;
          }
        }
      }

      setApprovedPhotos([]);
      navigation.setParams({
        profile: nextProfile,
        leftPhoto: nextLeftPhoto ?? null,
        rightPhoto: null,
        context: { ...context, index: nextIndex },
      });
    } catch (err) {
      console.error('Failed to load next profile for comparison', err);
      Alert.alert('Unable to load profile', 'Please try again in a moment.');
    } finally {
      setIsLoadingNext(false);
    }
  }, [navigation, params.context]);

  const providedPhotos = useMemo(() => {
    const items = params.profile?.photos;
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((photo) => photo?.status === 'approved' && photo?.url)
      .map((photo) => photo.url as string);
  }, [params.profile?.photos]);

  const allPhotos = useMemo(() => {
    const merged = [...providedPhotos, ...approvedPhotos];
    return Array.from(new Set(merged));
  }, [approvedPhotos, providedPhotos]);

  const left = params.leftPhoto ?? allPhotos[0] ?? null;
  const right = params.rightPhoto ?? allPhotos[1] ?? allPhotos[0] ?? null;
  const profileName = params.profile?.name ?? 'This profile';
  const profileBio = params.profile?.bio ?? null;
  const verificationStatus =
    typeof params.profile?.verification?.status === 'string'
      ? params.profile.verification.status
      : null;
  const verificationLabel = verificationStatus ? `Verification: ${verificationStatus}` : 'Verification pending';

  const isVertical = layout === 'vertical';
  const containerStyle = isVertical ? styles.verticalLayout : styles.horizontalLayout;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Compare photos</Text>
          <Text style={styles.subtitle}>{profileName}</Text>
          <Text style={styles.verificationLabel}>{verificationLabel}</Text>
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

        <View key={layout} style={[styles.compareArea, containerStyle]}>
          <View style={[styles.photoCard, isVertical ? styles.verticalPhotoCard : styles.horizontalPhotoCard]}>
            {left ? (
              <Image source={{ uri: left }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.placeholder]}>
                <Text style={styles.placeholderLabel}>No photo</Text>
              </View>
            )}
          </View>
          <View style={[styles.photoCard, isVertical ? styles.verticalPhotoCard : styles.horizontalPhotoCard]}>
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
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
              (isLoadingNext || !params.context?.items?.length) && styles.secondaryButtonDisabled,
            ]}
            onPress={handleNextProfile}
            disabled={isLoadingNext || !params.context?.items?.length}
          >
            {isLoadingNext ? (
              <ActivityIndicator color="#94a3b8" />
            ) : (
              <Text style={styles.secondaryButtonLabel}>Next profile</Text>
            )}
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
    gap: 16,
    alignItems: 'stretch',
  },
  verticalLayout: {
    flexDirection: 'column',
  },
  horizontalLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  photoCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    aspectRatio: 3 / 4,
    minHeight: 0,
    minWidth: 0,
  },
  verticalPhotoCard: {
    width: '100%',
  },
  horizontalPhotoCard: {
    flexBasis: 0,
    minWidth: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  placeholderLabel: {
    color: '#94a3b8',
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonLabel: {
    color: '#cbd5f5',
    fontWeight: '700',
    fontSize: 16,
  },
});
