import { Alert } from 'react-native';
import type { SubscriptionPlanId } from '../hooks/useSubscriptionStatus';

export function startUpgradeFlow(planId: Exclude<SubscriptionPlanId, 'free'>) {
  const label = planId === 'plus' ? 'Premium' : 'Elite';
  console.log('[subscription] start upgrade flow', planId);
  Alert.alert('Upgrade', `Start upgrade flow for ${label}.`);
}

export function startManageSubscription() {
  console.log('[subscription] open manage subscription');
  Alert.alert('Manage subscription', 'Open manage subscription/portal here.');
}
