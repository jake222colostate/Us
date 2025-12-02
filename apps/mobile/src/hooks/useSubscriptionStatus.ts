import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore, selectCurrentUser } from '../state/authStore';

export type SubscriptionPlanId = 'free' | 'plus' | 'pro';

type SubscriptionStatus = {
  planId: SubscriptionPlanId;
  planLabel: string;
  isPaid: boolean;
  isPro: boolean;
};

const PLAN_LABELS: Record<SubscriptionPlanId, string> = {
  free: 'Free',
  plus: 'Premium',
  pro: 'Elite',
};

const FALLBACK_STATUS: SubscriptionStatus = {
  planId: 'free',
  planLabel: PLAN_LABELS.free,
  isPaid: false,
  isPro: false,
};

export function useSubscriptionStatus(): SubscriptionStatus {
  const currentUser = useAuthStore(selectCurrentUser);
  const userId = currentUser?.id ?? null;

  const { data } = useQuery({
    queryKey: ['subscriptionStatus', userId],
    enabled: !!userId,
    // always refetch on mount/focus; keep cache short-lived so plan changes show up
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!userId) return FALLBACK_STATUS;

      const { data, error } = await supabase.rpc('get_user_subscription_status', {
        p_user_id: userId,
      });

      if (error) {
        console.warn('[subscription] failed to load status', error);
        return FALLBACK_STATUS;
      }

      const row = Array.isArray(data) ? data[0] : null;
      if (!row) return FALLBACK_STATUS;

      const planCode = (row.plan_code ?? 'free') as SubscriptionPlanId;
      const planLabel =
        row.plan_label ??
        PLAN_LABELS[planCode] ??
        PLAN_LABELS.free;

      return {
        planId: planCode,
        planLabel,
        isPaid: !!row.is_paid,
        isPro: !!row.is_pro,
      };
    },
  });

  if (!userId) return FALLBACK_STATUS;
  return data ?? FALLBACK_STATUS;
}
