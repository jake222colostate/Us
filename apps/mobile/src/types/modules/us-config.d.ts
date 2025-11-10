import type { BillingMode } from '@us/types';

export interface AppEnv {
  billingMode: BillingMode | 'auto';
  bigHeartPriceUsd: number;
  [key: string]: unknown;
}
export function loadAppEnv(): AppEnv;
