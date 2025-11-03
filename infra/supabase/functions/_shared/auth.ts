import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.39.2';

import { createServiceClient } from './supabaseClient.ts';

export type AuthContext = {
  user: User;
  accessToken: string;
  supabase: SupabaseClient;
  service: ReturnType<typeof createServiceClient>;
};

export async function requireAuth(req: Request): Promise<AuthContext> {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!accessToken) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    throw new Response('Missing Supabase configuration', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  return {
    user,
    accessToken,
    supabase,
    service: createServiceClient(),
  };
}
