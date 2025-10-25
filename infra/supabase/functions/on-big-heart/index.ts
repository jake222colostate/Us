import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createServiceClient } from '../_shared/supabaseClient.ts';
import { sendExpoPush } from '../_shared/notifications.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const service = createServiceClient();
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!accessToken) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    return new Response('Missing config', { status: 500 });
  }
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    return new Response('Missing config', { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { post_id, to_user, purchase_id, message } = body;
  if (!post_id || !to_user) {
    return new Response('Missing fields', { status: 400 });
  }

  if (purchase_id) {
    const { data: purchase, error } = await service
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .eq('user_id', user.id)
      .eq('sku', 'big_heart_oneoff')
      .eq('status', 'succeeded')
      .is('consumed_at', null)
      .single();
    if (error || !purchase) {
      return new Response('Invalid purchase', { status: 400 });
    }
    await service.from('purchases').update({ consumed_at: new Date().toISOString() }).eq('id', purchase_id);
  }

  const { error: insertError } = await service.from('hearts').insert({
    post_id,
    from_user: user.id,
    to_user,
    kind: 'big',
    paid: true,
    message: message ?? null,
  });
  if (insertError) {
    return new Response(insertError.message, { status: 400 });
  }

  const { data: devices } = await service
    .from('devices')
    .select('expo_push_token')
    .eq('user_id', to_user);

  await sendExpoPush(
    (devices ?? []).map((device) => ({
      to: device.expo_push_token,
      title: 'Big Heart incoming ✨',
      body: 'Someone sent a Big Heart. Open Likes to respond.',
      data: { type: 'big_heart', post_id, from_user: user.id },
    })),
  );

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
