import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import type { BillingMode } from '@us/types';
import { loadAppEnv } from '@us/config';
import { useToast } from './ToastProvider';
import { useAuth } from './AuthProvider';
import { supabase } from '../api/supabase';

export type BillingContextValue = {
  mode: BillingMode;
  priceDisplay: string;
  beginBigHeartPurchase: () => Promise<{ purchaseId?: string }>;
};

const BillingContext = createContext<BillingContextValue | undefined>(undefined);

export const BillingProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const env = loadAppEnv();
  const { show } = useToast();
  const { session } = useAuth();

  const mode: BillingMode = env.billingMode === 'auto' && Platform.OS === 'web' ? 'stripe_only' : env.billingMode;

  const value = useMemo<BillingContextValue>(
    () => ({
      mode,
      priceDisplay: `$${env.bigHeartPriceUsd.toFixed(2)}`,
      async beginBigHeartPurchase() {
        if (mode === 'stripe_only' || Platform.OS === 'web') {
          const origin =
            Platform.OS === 'web' && typeof window !== 'undefined' && window.location
              ? window.location.origin
              : undefined;

          try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
              body: {
                price: env.bigHeartPriceUsd,
                user_id: session?.user.id,
                ...(origin
                  ? {
                      success_url: `${origin}/?big-heart=success`,
                      cancel_url: `${origin}/?big-heart=cancel`,
                    }
                  : {}),
              },
            });
            if (error) throw error;
            const url = data?.url;
            if (
              url &&
              Platform.OS === 'web' &&
              typeof window !== 'undefined' &&
              typeof window.open === 'function'
            ) {
              window.open(url, '_blank');
            }
            return { purchaseId: undefined };
          } catch (err) {
            console.error(err);
            show('Unable to start Stripe checkout');
            return { purchaseId: undefined };
          }
        }

        show('RevenueCat purchase simulated.');
        return { purchaseId: 'revenuecat-dev-purchase' };
      },
    }),
    [env.bigHeartPriceUsd, mode, session?.user.id, show],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used inside BillingProvider');
  return ctx;
};
