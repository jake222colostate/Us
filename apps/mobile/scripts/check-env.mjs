#!/usr/bin/env node
import { env } from 'node:process';

const mode = process.argv[2] ?? 'lan';
const port = env.EXPO_DEV_SERVER_PORT ?? '8082';
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let host = 'unknown-host';
if (supabaseUrl) {
  try {
    host = new URL(supabaseUrl).host;
  } catch {
    host = supabaseUrl;
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env.');
} else {
  const maskedKey =
    supabaseKey.length > 8
      ? `${supabaseKey.slice(0, 4)}…${supabaseKey.slice(-4)}`
      : '***masked***';
  console.log(`🔐 Supabase env detected for ${host} (anon key ${maskedKey}).`);
}

const modeLabel = mode === 'tunnel' ? 'tunnel' : 'LAN';
console.log(`🚇 Launching Expo in ${modeLabel.toUpperCase()} mode on port ${port}. Watch for the Expo CLI QR code URL above.`);
