create table if not exists public.live_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_url text not null,
  live_started_at timestamptz not null default now(),
  live_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.live_posts enable row level security;

create policy "live select currently live or owner" on public.live_posts
  for select using (live_expires_at > now() or auth.uid() = user_id);

create policy "live insert owner only" on public.live_posts
  for insert with check (auth.uid() = user_id);

create policy "live delete owner only" on public.live_posts
  for delete using (auth.uid() = user_id);

create index if not exists live_posts_user_started_idx on public.live_posts (user_id, live_started_at desc);

create unique index if not exists live_posts_daily_unique on public.live_posts (user_id, (date(live_started_at at time zone 'UTC')));
