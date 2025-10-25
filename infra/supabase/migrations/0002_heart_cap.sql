-- Daily free heart cap support and notification coalescing

create index if not exists idx_hearts_fromuser_createdat
  on public.hearts (from_user, created_at);

create table if not exists public.remote_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.remote_config enable row level security;

create policy "remote_config_read"
  on public.remote_config
  for select
  using (true);

create or replace function public.free_heart_daily_cap() returns int
language sql stable as $$ select 125; $$;

create or replace function public.send_free_heart(_post uuid, _to uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _from uuid := auth.uid();
  _cap int;
  _used int;
  _id uuid;
begin
  if _from is null then
    raise exception 'auth required';
  end if;

  select coalesce((select (value->>'daily_cap')::int
                   from public.remote_config where key = 'free_heart'),
                  public.free_heart_daily_cap())
    into _cap;

  select count(*) into _used
  from public.hearts
  where from_user = _from
    and kind = 'normal'
    and created_at >= now() - interval '24 hours';

  if _used >= _cap then
    raise exception 'FREE_HEART_LIMIT_REACHED';
  end if;

  insert into public.hearts (post_id, from_user, to_user, kind, paid)
  values (_post, _from, _to, 'normal', false)
  returning id into _id;

  return _id;
end
$$;

create table if not exists public.notif_buffer (
  to_user uuid not null references public.profiles(user_id) on delete cascade,
  from_user uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null,
  count int not null default 0,
  last_at timestamptz not null default now(),
  primary key (to_user, from_user, kind)
);

alter table public.notif_buffer enable row level security;

create policy "notif_buffer_owner" on public.notif_buffer
  for select using (auth.uid() = to_user);

insert into public.remote_config(key, value)
values ('free_heart', jsonb_build_object('daily_cap', 125))
on conflict (key) do update set value = excluded.value, updated_at = now();
