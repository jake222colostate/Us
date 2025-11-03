import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

import { requireAuth } from '../_shared/auth.ts';
import { buildProfileAccess } from '../_shared/profileAccess.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const ctx = await requireAuth(req);
    const body = await req.json();
    const targetUserId = body?.target_user_id;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response('target_user_id is required', { status: 400 });
    }

    return await buildProfileAccess(ctx, targetUserId);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('profile-access error', error);
    return new Response('Unexpected error', { status: 500 });
  }
});
