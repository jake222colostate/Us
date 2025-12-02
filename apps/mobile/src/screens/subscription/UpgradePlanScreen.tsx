import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAppTheme, type AppPalette } from '../../theme/palette';
import { spacing } from '../../theme/spacing';
import SubscriptionCTA from '../../components/subscription/SubscriptionCTA';
import { useSubscriptionStatus, type SubscriptionPlanId } from '../../hooks/useSubscriptionStatus';
import { startManageSubscription, startUpgradeFlow } from '../../lib/subscriptionActions';

const plans: {
  id: Exclude<SubscriptionPlanId, 'free'>;
  title: string;
  price: string;
  tagline: string;
  bullets: string[];
  badge?: string;
}[] = [
  {
    id: 'plus',
    title: 'Premium',
    price: '$8 / month',
    tagline: 'Boost your visibility',
    bullets: ['3 Live Posts every 5 hours', '10 Feed Posts per day', 'Increased visibility vs free users'],
  },
  {
    id: 'pro',
    title: 'Elite',
    price: '$20 / month',
    tagline: 'Maximum exposure',
    bullets: ['10 Live Posts every 5 hours', 'Up to 50 Feed Posts per day', 'Top visibility priority'],
    badge: 'Most popular',
  },
];

export default function UpgradePlanScreen() {
  const palette = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { planId, planLabel, isPaid } = useSubscriptionStatus();
  const route = useRoute<RouteProp<RootStackParamList, 'UpgradePlan'>>();
  const resetAt = (route.params as any)?.resetAt as string | undefined;

  const nextPostMsg = useMemo(() => {
    if (!resetAt) return null;
    const ts = Date.parse(resetAt);
    if (!Number.isFinite(ts)) return null;
    const diffMs = ts - Date.now();
    if (diffMs <= 0) return null;
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return `Post Again In: ${h}h ${m}m ${s}s`;
  }, [resetAt]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {isPaid ? <Text style={styles.currentBadge}>You’re currently on {planLabel}</Text> : null}
          <Text style={styles.title}>Upgrade your account</Text>
          <Text style={styles.subtitle}>Get more visibility and more posts per day.</Text>
        </View>

        {nextPostMsg && (
          <View style={styles.nextPostBanner}>
            <Text style={styles.nextPostLabel}>{nextPostMsg}</Text>
          </View>
        )}

        <View style={styles.cardsWrapper}>
          {plans.map((plan) => {
            const isCurrent = planId === plan.id;
            return (
              <View key={plan.id} style={[styles.card, plan.id === 'pro' ? styles.eliteCard : null]}>
                {plan.badge ? <Text style={styles.badge}>{plan.badge}</Text> : null}
                <View style={styles.cardHeader}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planTagline}>{plan.tagline}</Text>
                </View>

                <View style={styles.bulletList}>
                  {plan.bullets.map((bullet) => (
                    <Text key={bullet} style={styles.bulletItem}>
                      • {bullet}
                    </Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isCurrent}
                    onPress={() => startUpgradeFlow(plan.id)}
                    style={({ pressed }) => [
                      styles.ctaButton,
                      isCurrent ? styles.ctaButtonDisabled : styles.ctaButtonActive,
                      plan.id === 'pro' ? styles.ctaElite : null,
                      pressed && !isCurrent ? styles.ctaButtonPressed : null,
                    ]}
                  >
                    <Text style={[styles.ctaLabel, isCurrent ? styles.ctaLabelDisabled : null]}>
                      {isCurrent ? 'Current plan' : `Choose ${plan.title}`}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {isPaid ? (
          <View style={styles.manageRow}>
            <SubscriptionCTA location="profile" />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    header: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    subtitle: {
      color: palette.textSecondary,
      lineHeight: 20,
    },
    currentBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: palette.surface,
      borderRadius: 999,
      color: palette.accent,
      fontWeight: '700',
    },
    nextPostBanner: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      backgroundColor: '#991b1b',
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
    nextPostLabel: {
      color: '#fee2e2',
      fontWeight: '700',
      textAlign: 'center',
    },
    cardsWrapper: {
      gap: spacing.lg,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 18,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 6,
      position: 'relative',
      overflow: 'hidden',
      gap: spacing.md,
    },
    eliteCard: {
      borderColor: palette.accent,
    },
    badge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: palette.accent,
      color: palette.onAccent,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      fontWeight: '700',
      fontSize: 12,
      overflow: 'hidden',
    },
    cardHeader: {
      gap: spacing.xs,
    },
    planTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    planPrice: {
      color: palette.accent,
      fontSize: 18,
      fontWeight: '700',
    },
    planTagline: {
      color: palette.textSecondary,
    },
    bulletList: {
      gap: spacing.xs,
    },
    bulletItem: {
      color: palette.textPrimary,
      fontSize: 15,
      lineHeight: 20,
    },
    cardFooter: {
      marginTop: spacing.sm,
    },
    ctaButton: {
      paddingVertical: spacing.md,
      borderRadius: 14,
      overflow: 'hidden',
    },
    ctaButtonActive: {
      backgroundColor: palette.accent,
      color: palette.onAccent,
    },
    ctaElite: {
      backgroundColor: palette.accentMuted,
    },
    ctaButtonDisabled: {
      backgroundColor: palette.surface,
      color: palette.muted,
    },
    ctaButtonPressed: {
      opacity: 0.9,
    },
    ctaLabel: {
      color: palette.onAccent,
      fontWeight: '700',
      textAlign: 'center',
      width: '100%',
    },
    ctaLabelDisabled: {
      color: palette.muted,
    },
    manageRow: {
      alignItems: 'center',
    },
    manageLink: {
      color: palette.accent,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}
