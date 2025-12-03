import { Alert } from 'react-native';
import { supabase } from '../api/supabase';
import type { SubscriptionPlanId } from '../hooks/useSubscriptionStatus';

async function applyPlan(planCode: SubscriptionPlanId) {
  try {
    const { error } = await supabase.rpc('set_user_subscription', {
      plan_code: planCode,
    });

    if (error) {
      console.warn('[subscription] set_user_subscription failed', error);
      Alert.alert('Error', 'Something went wrong updating your plan. Please try again.');
      return;
    }

    const label =
      planCode === 'plus' ? 'Premium' :
      planCode === 'pro' ? 'Elite' :
      'Free';

    try {
      const { queryClient } = await import('../state/queryClient');
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      console.log('[subscription] cache invalidated after plan change');
    } catch (err) {
      console.warn('[subscription] could not refresh cache', err);
    }

  } catch (e) {
    console.warn('[subscription] unexpected error', e);
    Alert.alert('Error', 'Unable to update your plan right now.');
  }
}

export function startUpgradeFlow(planId: Exclude<SubscriptionPlanId, 'free'>) {
  const label = planId === 'plus' ? 'Premium' : 'Elite';
  console.log('[subscription] start upgrade flow (dev)', planId);

  Alert.alert(
    'Confirm upgrade',
    `Switch to the ${label} plan in this dev build?`,
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: () => {
          void applyPlan(planId);
        },
      },
    ],
  );
}

export function startManageSubscription() {
  console.log('[subscription] manage subscription: immediate downgrade to free');
  void applyPlan('free');
}