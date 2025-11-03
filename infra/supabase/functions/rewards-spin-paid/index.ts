import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';

import { requireAuth } from '../_shared/auth.ts';
import { applyReward, chooseReward, getRewardStatus, recordReward } from '../_shared/rewards.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const ctx = await requireAuth(req);
    const body = await req.json().catch(() => ({}));

    if (stripe) {
      const paymentMethodId = body?.payment_method_id;
      if (!paymentMethodId || typeof paymentMethodId !== 'string') {
        return new Response('payment_method_id is required when Stripe is configured', { status: 400 });
      }

      await stripe.paymentIntents.create({
        amount: 100,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true },
        metadata: {
          viewer_id: ctx.user.id,
          purpose: 'reward_spin_paid',
        },
      });
    }

    const reward = chooseReward();
    await recordReward(ctx, 'paid', reward);
    await applyReward(ctx, reward);
    const nextStatus = await getRewardStatus(ctx);

    return new Response(
      JSON.stringify({
        spin_type: 'paid',
        reward,
        status: nextStatus,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('rewards-spin-paid error', error);
    return new Response('Unexpected error', { status: 500 });
  }
});
