import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type ComparePhotosParamList = {
  ComparePhotos:
    | {
        viewerImageUri?: string | null;
        viewerName?: string | null;
        profileImageUri?: string | null;
        profileName?: string | null;
      }
    | undefined;
};

export type ComparePhotosScreenProps = NativeStackScreenProps<
  ComparePhotosParamList,
  'ComparePhotos'
>;

export const ComparePhotosScreen: React.FC<ComparePhotosScreenProps> = ({
  navigation,
  route,
}) => {
  const params = route.params ?? {};
  const viewerImageUri = params.viewerImageUri ?? '';
  const viewerName = params.viewerName ?? '';
  const profileImageUri = params.profileImageUri ?? '';
  const profileName = params.profileName ?? '';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const modalWidth = Math.min(width - spacing.md * 2, 720);
  const horizontalPadding = width >= 768 ? spacing.lg : spacing.md;
  const photosGap = width >= 768 ? spacing.lg : spacing.md;
  const maxColumnWidth = width >= 1024 ? 360 : width >= 768 ? 320 : 280;
  const isLandscape = width > height;
  const columnSpacing = width < 480 ? spacing.sm : photosGap;

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.modal,
          {
            width: modalWidth,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.lg),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close comparison"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>See the Connection</Text>
          <Text style={styles.subtitle}>
            Tilt your phone horizontally for an even closer look.
          </Text>

          <View style={[styles.photosRow, { marginTop: spacing.lg }]}>
            <View
              style={[
                styles.photoColumn,
                {
                  marginRight: columnSpacing,
                  maxWidth: maxColumnWidth,
                },
              ]}
            >
              <Text style={styles.photoLabel}>{viewerName}</Text>
              <View style={styles.photoFrame}>
                <Image source={{ uri: viewerImageUri }} style={styles.photo} />
              </View>
            </View>

            <View
              style={[
                styles.photoColumn,
                {
                  maxWidth: maxColumnWidth,
                },
              ]}
            >
              <Text style={styles.photoLabel}>{profileName}</Text>
              <View style={styles.photoFrame}>
                <Image source={{ uri: profileImageUri }} style={styles.photo} />
              </View>
            </View>
          </View>

          <View
            style={[styles.metaRow, isLandscape ? styles.metaRowLandscape : styles.metaRowPortrait]}
          >
            <Text style={[styles.metaText, styles.metaPrimaryText]}>
              Spot the spark, swipe with confidence.
            </Text>
            <Text
              style={[
                styles.metaTextSecondary,
                !isLandscape && styles.metaTextStacked,
              ]}
            >
              Share your thoughts together after this moment.
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.secondaryActionPressed,
                styles.secondaryActionSpacing,
              ]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
                style={styles.actionIcon}
              />
              <Text style={styles.secondaryActionText}>Not Now</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
              onPress={() => {
                console.log('Matched with', profileName);
                navigation.goBack();
              }}
            >
              <Ionicons
                name="heart"
                size={18}
                color="#fff"
                style={styles.actionIcon}
              />
              <Text style={styles.primaryActionText}>Match</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 20, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 32,
    overflow: 'hidden',
  },
  headerRow: {
    width: '100%',
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  photosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaRowLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaRowPortrait: {
    flexDirection: 'column',
  },
  metaPrimaryText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaText: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 360,
  },
  metaTextSecondary: {
    color: colors.textSecondary,
  },
  metaTextStacked: {
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryActionPressed: {
    opacity: 0.7,
  },
  secondaryActionSpacing: {
    marginRight: spacing.md,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionIcon: {
    marginRight: spacing.xs,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryActionPressed: {
    opacity: 0.9,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
  },
});
