import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';
import { createServiceClient } from '../_shared/supabaseClient.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

serve(async (req) => {
  if (!stripe || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new Response('Missing signature', { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error(err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const userId = metadata.user_id;
    if (userId) {
      const amount = session.amount_total ?? 0;
      const currency = session.currency?.toUpperCase() ?? 'USD';
      const service = createServiceClient();
      await service.from('purchases').upsert(
        {
          user_id: userId,
          sku: 'big_heart_oneoff',
          provider: 'stripe',
          provider_txn_id: session.id,
          amount_cents: amount,
          currency,
          status: 'succeeded',
        },
        { onConflict: 'provider_txn_id' },
      );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
