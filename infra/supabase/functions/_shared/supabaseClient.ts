import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2';

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Missing Supabase environment configuration');
  }
  return createClient(url, key);
}
