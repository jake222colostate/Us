import { getSupabaseClient } from './supabase';

export type SubscriptionTier = 'free' | 'plus' | 'elite';

export async function fetchUserSubscriptionTier(
  userId: string | null | undefined,
): Promise<SubscriptionTier> {
  if (!userId) return 'free';

  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_user_subscription_tier', {
    p_user_id: userId,
  });

  if (error) {
    console.warn('Failed to load user subscription tier', error);
    return 'free';
  }

  const value = (data as string | null) ?? 'free';
  if (value === 'elite' || value === 'plus' || value === 'free') {
    return value;
  }
  return 'free';
}
