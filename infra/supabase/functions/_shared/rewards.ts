import type { AuthContext } from './auth.ts';

type RewardDefinition = {
  type: string;
  label: string;
  weight: number;
  metadata?: Record<string, unknown>;
};

const REWARDS: RewardDefinition[] = [
  { type: 'boost', label: '1-hour visibility boost', weight: 25, metadata: { duration_minutes: 60 } },
  { type: 'extra_like', label: 'Extra like', weight: 25 },
  { type: 'highlight', label: 'Profile highlight for 30 minutes', weight: 20, metadata: { duration_minutes: 30 } },
  { type: 'superlike', label: 'Bonus superlike', weight: 15 },
  { type: 'nothing', label: 'Better luck next time', weight: 15 },
];

export type RewardResult = {
  reward_type: string;
  reward_label: string;
  reward_value: Record<string, unknown>;
};

function pickReward(): RewardResult {
  const totalWeight = REWARDS.reduce((sum, reward) => sum + reward.weight, 0);
  const threshold = Math.random() * totalWeight;
  let cumulative = 0;
  for (const reward of REWARDS) {
    cumulative += reward.weight;
    if (threshold <= cumulative) {
      return {
        reward_type: reward.type,
        reward_label: reward.label,
        reward_value: reward.metadata ?? {},
      };
    }
  }
  const fallback = REWARDS[REWARDS.length - 1];
  return {
    reward_type: fallback.type,
    reward_label: fallback.label,
    reward_value: fallback.metadata ?? {},
  };
}

export async function recordReward(
  ctx: AuthContext,
  spinType: 'free' | 'paid',
  reward: RewardResult,
) {
  const { error } = await ctx.service.from('reward_spins').insert({
    user_id: ctx.user.id,
    spin_type: spinType,
    reward_type: reward.reward_type,
    reward_value: reward.reward_value,
    spin_at: new Date().toISOString(),
  });
  if (error) {
    throw new Response(error.message ?? 'Unable to store reward', { status: 400 });
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function applyReward(ctx: AuthContext, reward: RewardResult) {
  const now = new Date();
  if (reward.reward_type === 'boost') {
    const duration = Number(reward.reward_value?.duration_minutes ?? 60);
    const expiresAt = addMinutes(now, duration);
    const { error } = await ctx.service.from('user_bonuses').insert({
      user_id: ctx.user.id,
      bonus_type: 'boost',
      quantity: 1,
      expires_at: expiresAt.toISOString(),
      metadata: reward.reward_value ?? {},
    });
    if (error) {
      throw new Response(error.message ?? 'Failed to apply boost', { status: 400 });
    }
    return;
  }

  if (reward.reward_type === 'highlight') {
    const duration = Number(reward.reward_value?.duration_minutes ?? 30);
    const expiresAt = addMinutes(now, duration);
    const { error } = await ctx.service.from('user_bonuses').insert({
      user_id: ctx.user.id,
      bonus_type: 'highlight',
      quantity: 1,
      expires_at: expiresAt.toISOString(),
      metadata: reward.reward_value ?? {},
    });
    if (error) {
      throw new Response(error.message ?? 'Failed to apply highlight', { status: 400 });
    }
    return;
  }

  if (reward.reward_type === 'extra_like' || reward.reward_type === 'superlike') {
    const { error } = await ctx.service.from('user_bonuses').insert({
      user_id: ctx.user.id,
      bonus_type: reward.reward_type,
      quantity: 1,
      expires_at: null,
      metadata: reward.reward_value ?? {},
    });
    if (error) {
      throw new Response(error.message ?? 'Failed to apply reward', { status: 400 });
    }
    return;
  }
}

export async function getRewardStatus(ctx: AuthContext) {
  const nowIso = new Date().toISOString();
  const { data: lastFree } = await ctx.service
    .from('reward_spins')
    .select('*')
    .eq('user_id', ctx.user.id)
    .eq('spin_type', 'free')
    .order('spin_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSpinDate = lastFree?.spin_at ? new Date(lastFree.spin_at) : null;
  const nextFreeAt = lastSpinDate ? new Date(lastSpinDate.getTime() + 24 * 60 * 60 * 1000) : new Date();
  const freeAvailable = !lastSpinDate || nextFreeAt <= new Date();

  const { data: activeBonuses } = await ctx.service
    .from('user_bonuses')
    .select('*')
    .eq('user_id', ctx.user.id)
    .or('expires_at.is.null,expires_at.gt.' + nowIso);

  const { data: latestSpin } = await ctx.service
    .from('reward_spins')
    .select('*')
    .eq('user_id', ctx.user.id)
    .order('spin_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    free_available: freeAvailable,
    next_free_spin_at: nextFreeAt.toISOString(),
    last_spin: latestSpin ?? null,
    active_bonuses: activeBonuses ?? [],
  };
}

export function chooseReward(): RewardResult {
  return pickReward();
}
