-- Initialize core schema for the Us mobile app
-- Safe to re-run; statements use IF NOT EXISTS guards where possible

create extension if not exists "pgcrypto";

-- Profiles ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  birthday date,
  bio text,
  interests text[] default array[]::text[],
  location text,
  avatar_url text,
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified', 'pending', 'verified', 'rejected')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists photos_user_idx on public.photos (user_id);
create index if not exists photos_status_idx on public.photos (status);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'like' check (kind in ('like', 'superlike')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint likes_unique_pair unique (from_user, to_user)
);
create index if not exists likes_from_idx on public.likes (from_user);
create index if not exists likes_to_idx on public.likes (to_user);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint matches_distinct_users check (user_a <> user_b)
);
create unique index if not exists matches_unique_pair on public.matches (
  least(user_a, user_b),
  greatest(user_a, user_b)
);

create table if not exists public.verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'mock',
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  session_id text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists verification_sessions_user_idx on public.verification_sessions (user_id);
create index if not exists verification_sessions_session_idx on public.verification_sessions (session_id);

-- Updated-at trigger --------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN SELECT relname FROM pg_class WHERE relname in ('profiles','photos','likes','matches','verification_sessions')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'touch_' || rec.relname
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',
        'touch_' || rec.relname,
        rec.relname
      );
    END IF;
  END LOOP;
END;$$;

-- Row level security -------------------------------------------------
alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.verification_sessions enable row level security;

-- Profiles policies
create policy if not exists "Users can insert their profile" on public.profiles
for insert
with check (auth.uid() = id);

create policy if not exists "Users can view their profile" on public.profiles
for select
using (auth.uid() = id);

create policy if not exists "Users can update their profile" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow viewing public profiles when they have an approved photo
create policy if not exists "Public profiles with approved media are viewable" on public.profiles
for select
using (
  exists (
    select 1 from public.photos p
    where p.user_id = public.profiles.id
      and p.status = 'approved'
  )
);

-- Photos policies
create policy if not exists "Owners manage their photos" on public.photos
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Approved photos visible" on public.photos
for select
using (status = 'approved');

-- Likes policies
create policy if not exists "Authors manage likes" on public.likes
for all
using (auth.uid() = from_user)
with check (auth.uid() = from_user);

-- Matches policies
create policy if not exists "Participants insert matches" on public.matches
for insert
with check (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "Participants view matches" on public.matches
for select
using (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "Participants update matches" on public.matches
for update
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "Participants delete matches" on public.matches
for delete
using (auth.uid() = user_a or auth.uid() = user_b);

-- Verification session policies
create policy if not exists "Owners manage verification sessions" on public.verification_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Storage bucket -----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

create policy if not exists "Owners manage profile photo objects" on storage.objects
for all
using (
  bucket_id = 'profile-photos' and
  auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'profile-photos' and
  auth.uid()::text = split_part(name, '/', 1)
);

create policy if not exists "Approved profile photos may be viewed" on storage.objects
for select
using (
  bucket_id = 'profile-photos' and
  exists (
    select 1 from public.photos p
    where p.url = storage.objects.name
      and p.status = 'approved'
  )
);

-- Helper to keep photos/storage in sync via serverless worker
create or replace function public.queue_profile_photo_removal(_photo_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  path text;
begin
  delete from public.photos where id = _photo_id returning url into path;
  return path;
end;
$$;

grant execute on function public.queue_profile_photo_removal(uuid) to authenticated;
