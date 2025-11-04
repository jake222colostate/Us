import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  apiBaseUrl?: string;
};

const fallbackEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};

let cachedClient: SupabaseClient | null = null;
let warned = false;

function resolveSupabaseEnv() {
  const supabaseUrl = extra.supabaseUrl ?? fallbackEnv.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = extra.supabaseAnonKey ?? fallbackEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return { supabaseUrl, supabaseAnonKey };
}

function createSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!warned) {
      console.warn(
        'Supabase environment variables are not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env.',
      );
      warned = true;
    }
    throw new Error(
      'Missing Supabase credentials. Update your Expo env (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY) and restart.',
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

export function getSupabaseClient(): SupabaseClient {
  return createSupabaseClient();
}

export function requireSupabaseClient(): SupabaseClient {
  return createSupabaseClient();
}

export const supabase: SupabaseClient = new Proxy(
  {} as SupabaseClient,
  {
    get(_target, prop) {
      const client = createSupabaseClient();
      const value = (client as Record<PropertyKey, unknown>)[prop];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(client);
      }
      return value;
    },
  },
);

export const apiBaseUrl = extra.apiBaseUrl ?? fallbackEnv.EXPO_PUBLIC_API_BASE_URL ?? '';
