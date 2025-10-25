import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createServiceClient } from '../_shared/supabaseClient.ts';
import { sendExpoPush } from '../_shared/notifications.ts';

const TEN_MINUTES_MS = 10 * 60 * 1000;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.json();
  const heart = payload.record;
  if (!heart || heart.kind !== 'normal') {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  const supabase = createServiceClient();

  const now = new Date();
  const nowIso = now.toISOString();

  const { data: bumpRows, error: bumpError } = await supabase.rpc('bump_notif_buffer', {
    _to: heart.to_user,
    _from: heart.from_user,
  });

  if (bumpError) {
    console.error('Failed to bump notif buffer', bumpError.message);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bump = (bumpRows as { prior_count: number; last_at: string; inserted: boolean }[] | null)?.[0];

  const sendPush = async (total: number) => {
    const { data: liker } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', heart.from_user)
      .maybeSingle();
    const displayName = liker?.display_name ?? 'Someone';
    const body =
      total === 1
        ? `${displayName} liked your post ❤️`
        : `${displayName} liked ${total} of your posts ❤️`;

    const { data: devices } = await supabase
      .from('devices')
      .select('expo_push_token')
      .eq('user_id', heart.to_user);

    await sendExpoPush(
      (devices ?? []).map((device) => ({
        to: device.expo_push_token,
        title: 'New like',
        body,
        data: { type: 'heart', post_id: heart.post_id, from_user: heart.from_user, total },
      })),
    );
  };

  if (!bump) {
    await sendPush(1);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (bump.inserted) {
    await sendPush(1);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lastAt = new Date(bump.last_at);
  const timeSinceLastPush = now.getTime() - lastAt.getTime();

  if (timeSinceLastPush < TEN_MINUTES_MS) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const total = (bump.prior_count ?? 0) + 1;

  const { error: resetError } = await supabase
    .from('notif_buffer')
    .update({ count: 0, last_at: nowIso })
    .eq('to_user', heart.to_user)
    .eq('from_user', heart.from_user)
    .eq('kind', 'heart');

  if (resetError) {
    console.error('Failed to reset notif buffer', resetError.message);
  }

  await sendPush(total);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
