import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

serve(async (req) => {
  if (!stripe) {
    return new Response('Stripe not configured', { status: 500 });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { price, success_url, cancel_url, user_id } = body;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    metadata: { user_id },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Big Heart' },
          unit_amount: Math.round((price ?? 3.99) * 100),
        },
        quantity: 1,
      },
    ],
    success_url,
    cancel_url,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
