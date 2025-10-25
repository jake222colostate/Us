import { createClient } from '@supabase/supabase-js';
import { loadAppEnv } from '@us/config';

const env = loadAppEnv();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'us-auth',
  },
});
