-- Supabase schema for the Us mobile app
create extension if not exists "pgcrypto";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  bio text,
  created_at timestamp with time zone default now()
);

-- photos (approved only appear in feed)
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  url text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamp with time zone default now()
);

-- likes (who liked whom)
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  liker uuid references auth.users(id) on delete cascade,
  likee uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(liker, likee)
);

-- matches (mutual)
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  a uuid references auth.users(id) on delete cascade,
  b uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(a, b)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;

-- policies
delete from pg_policies where tablename in ('profiles','photos','likes','matches') and schemaname = 'public';

create policy if not exists "profiles self read/write" on public.profiles
  for select using (true)
  with check (auth.uid() = id);

create policy if not exists "photos read approved or own" on public.photos
  for select using (status = 'approved' or auth.uid() = user_id);

create policy if not exists "photos insert own" on public.photos
  for insert with check (auth.uid() = user_id);

create policy if not exists "likes read own or involving me" on public.likes
  for select using (liker = auth.uid() or likee = auth.uid());

create policy if not exists "likes insert me as liker" on public.likes
  for insert with check (liker = auth.uid());

create policy if not exists "matches read involving me" on public.matches
  for select using (a = auth.uid() or b = auth.uid());
