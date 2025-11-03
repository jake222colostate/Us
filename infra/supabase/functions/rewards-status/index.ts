import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

import { requireAuth } from '../_shared/auth.ts';
import { getRewardStatus } from '../_shared/rewards.ts';

serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const ctx = await requireAuth(req);
    const status = await getRewardStatus(ctx);
    return new Response(JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('rewards-status error', error);
    return new Response('Unexpected error', { status: 500 });
  }
});
