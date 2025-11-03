import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';

import { requireAuth } from '../_shared/auth.ts';
import { assertProfileAccessible, buildProfileAccess, grantProfileUnlock } from '../_shared/profileAccess.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const ctx = await requireAuth(req);
    const body = await req.json();
    const targetUserId = body?.target_user_id;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response('target_user_id is required', { status: 400 });
    }

    const alreadyUnlocked = await assertProfileAccessible(ctx, targetUserId);
    if (alreadyUnlocked) {
      return await buildProfileAccess(ctx, targetUserId);
    }

    if (stripe) {
      const paymentMethodId = body?.payment_method_id;
      if (!paymentMethodId || typeof paymentMethodId !== 'string') {
        return new Response('payment_method_id is required when Stripe is configured', { status: 400 });
      }

      await stripe.paymentIntents.create({
        amount: 499,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true },
        metadata: {
          viewer_id: ctx.user.id,
          target_user_id: targetUserId,
          purpose: 'profile_unlock',
        },
      });
    }

    await grantProfileUnlock(ctx, targetUserId, stripe ? 'payment' : 'stub');

    return await buildProfileAccess(ctx, targetUserId);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('profile-unlock error', error);
    return new Response('Unexpected error', { status: 500 });
  }
});
