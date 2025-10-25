import { z } from 'zod';
import type { BillingMode } from '@us/types';

type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  billingMode: BillingMode;
  stripePublishableKey?: string;
  revenueCatSdkKey?: string;
  bigHeartPriceUsd: number;
};

const envSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(1),
  billingMode: z.union([z.literal('auto'), z.literal('stripe_only')]),
  stripePublishableKey: z.string().optional(),
  revenueCatSdkKey: z.string().optional(),
  bigHeartPriceUsd: z.number().positive(),
});

export function loadAppEnv(): Env {
  const raw = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    billingMode: (process.env.EXPO_PUBLIC_BILLING_MODE as BillingMode | undefined) ?? 'auto',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    revenueCatSdkKey: process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY,
    bigHeartPriceUsd: Number(process.env.EXPO_PUBLIC_BIGHEART_PRICE_USD ?? '3.99'),
  } satisfies Partial<Record<keyof Env, unknown>>;

  const parsed = envSchema.parse(raw);
  return parsed;
}

export type { Env as AppEnv };
