import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import { startManageSubscription } from '../../lib/subscriptionActions';

export type SubscriptionLocation = 'profile' | 'feed' | 'likes';

type Props = {
  location: SubscriptionLocation;
};

export default function SubscriptionCTA({ location: _location }: Props) {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const navigation = useNavigation<any>();
  const { planId, planLabel, isPaid } = useSubscriptionStatus();

  const isFree = planId === 'free';
  const buttonLabel = isFree ? 'Cancel/Change Plan' : 'Cancel Subscription';
  const caption = isPaid ? `You’re on ${planLabel}` : null;

  const handlePress = () => {
    if (isFree) {
      navigation.navigate('UpgradePlan');
      return;
    }
    startManageSubscription();
    navigation.navigate('UpgradePlan');
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          isFree ? styles.primary : styles.destructive,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.label}>{buttonLabel}</Text>
      </Pressable>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    container: {
      width: '100%',
      gap: 6,
    },
    button: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: palette.accent,
    },
    destructive: {
      backgroundColor: palette.danger,
    },
    pressed: {
      opacity: 0.9,
    },
    label: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 16,
    },
    caption: {
      color: palette.textSecondary,
      textAlign: 'center',
      fontSize: 13,
    },
  });
}
