import { Alert } from 'react-native';
import { supabase } from '../api/supabase';
import type { SubscriptionPlanId } from '../hooks/useSubscriptionStatus';

function getPlanLabel(planCode: SubscriptionPlanId): string {
  switch (planCode) {
    case 'plus':
      return 'Premium';
    case 'pro':
      return 'Elite';
    default:
      return 'Free';
  }
}

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

    const label = getPlanLabel(planCode);
    console.log('[subscription] plan updated to', label);

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
  console.log('[subscription] start upgrade flow (no popup)', planId);
  void applyPlan(planId);
}

export function startManageSubscription() {
  console.log('[subscription] change subscription (no popup, downgrade to Free)');
  void applyPlan('free');
}
