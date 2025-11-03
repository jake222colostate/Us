import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

type ExtraEnv = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra || {}) as ExtraEnv;

const fallbackEnv = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};

const supabaseUrl = extra.supabaseUrl ?? fallbackEnv.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = extra.supabaseAnonKey ?? fallbackEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  console.warn(
    'Supabase environment variables are not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const supabase = client;

export function requireSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client is not configured. Check your Expo public env variables.');
  }
  return client;
}

export const apiBaseUrl = extra.apiBaseUrl ?? fallbackEnv.EXPO_PUBLIC_API_BASE_URL ?? '';
