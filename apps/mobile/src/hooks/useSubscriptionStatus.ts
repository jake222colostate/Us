import { useMemo } from 'react';

export type SubscriptionPlanId = 'free' | 'plus' | 'pro';

type SubscriptionStatus = {
  planId: SubscriptionPlanId;
  planLabel: string;
  isPaid: boolean;
  isPro: boolean;
};

const MOCK_PLAN_ID: SubscriptionPlanId = 'free';

const PLAN_LABELS: Record<SubscriptionPlanId, string> = {
  free: 'Free',
  plus: 'Premium',
  pro: 'Elite',
};

export function useSubscriptionStatus(): SubscriptionStatus {
  return useMemo(() => {
    const planId = MOCK_PLAN_ID;
    const planLabel = PLAN_LABELS[planId];
    const isPaid = planId !== 'free';

    return {
      planId,
      planLabel,
      isPaid,
      isPro: planId === 'pro',
    };
  }, []);
}
