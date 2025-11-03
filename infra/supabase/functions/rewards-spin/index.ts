import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

import { requireAuth } from '../_shared/auth.ts';
import { applyReward, chooseReward, getRewardStatus, recordReward } from '../_shared/rewards.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const ctx = await requireAuth(req);
    const status = await getRewardStatus(ctx);
    if (!status.free_available) {
      return new Response(
        JSON.stringify({
          error: 'already_spun',
          next_free_spin_at: status.next_free_spin_at,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const reward = chooseReward();
    await recordReward(ctx, 'free', reward);
    await applyReward(ctx, reward);
    const nextStatus = await getRewardStatus(ctx);

    return new Response(
      JSON.stringify({
        spin_type: 'free',
        reward,
        status: nextStatus,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('rewards-spin error', error);
    return new Response('Unexpected error', { status: 500 });
  }
});
