import React from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pill from './Pill';
import { useMemo } from 'react';
import { useAppTheme, type AppPalette } from '../theme/palette';

type Props = {
  name: string;
  age: number;
  distanceMi?: number;
  bio: string;
  avatar: string;
  photo?: string;
  onCompare?: () => void;
  onOpenProfile?: () => void;
};

const createStyles = (palette: AppPalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: palette.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
      marginHorizontal: 16,
      marginTop: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: palette.surface,
    },
    headerCopy: {
      flex: 1,
    },
    name: {
      color: palette.textPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    distance: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 2,
    },
    photo: {
      width: '100%',
      aspectRatio: 3 / 4,
      backgroundColor: palette.surface,
    },
    photoPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    placeholderLabel: {
      color: palette.muted,
      fontSize: 14,
      fontWeight: '600',
    },
    body: {
      padding: 16,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    heartButton: {
      marginRight: 8,
    },
    heartIcon: {
      fontSize: 22,
    },
    bio: {
      color: palette.textPrimary,
      marginBottom: 16,
      lineHeight: 20,
    },
    bioName: {
      fontWeight: '600',
    },
    compareButton: {
      backgroundColor: palette.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    compareLabel: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 16,
    },
  });

export default function Card({
  name,
  age,
  distanceMi,
  bio,
  avatar,
  photo,
  onCompare,
  onOpenProfile,
}: Props) {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onOpenProfile} accessibilityRole="button">
        <View style={styles.header}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.headerCopy}>
            <Text style={styles.name}>
              {name}, {age}
            </Text>
            {typeof distanceMi === 'number' ? (
              <Text style={styles.distance}>📍 {distanceMi} miles away</Text>
            ) : null}
          </View>
        </View>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.placeholderLabel}>Awaiting approval</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.heartButton}>
            <Text style={styles.heartIcon}>🤍</Text>
          </TouchableOpacity>
          <Pill>3m</Pill>
        </View>

        <Text style={styles.bio}>
          <Text style={styles.bioName}>{name} </Text>
          {bio}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onCompare}
          style={styles.compareButton}
        >
          <Text style={styles.compareLabel}>💗 Compare Photos Side by Side</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

