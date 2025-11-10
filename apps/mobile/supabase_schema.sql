-- === CORE TABLES ===
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  verification_status text default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  status text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz not null default now(),
  approved_by uuid
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',  -- 'pending' | 'matched' | 'blocked'
  created_at timestamptz not null default now()
);

-- indexes
create index if not exists photos_user_id_idx on public.photos(user_id);
create index if not exists photos_status_idx   on public.photos(status);
create index if not exists matches_users_idx   on public.matches(user_a, user_b);
create index if not exists profiles_verif_idx  on public.profiles(verification_status);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  storage_path text,
  caption text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'post',
  created_at timestamptz not null default now(),
  constraint likes_unique_post unique (post_id, from_user, kind)
);

create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists likes_post_id_idx on public.likes(post_id);
create index if not exists likes_from_user_idx on public.likes(from_user);

-- === RLS ===
alter table public.profiles enable row level security;
alter table public.photos   enable row level security;
alter table public.matches  enable row level security;
alter table public.posts    enable row level security;
alter table public.likes    enable row level security;

-- PROFILES: read all, update own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_all'
  ) then
    create policy profiles_select_all on public.profiles for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own'
  ) then
    create policy profiles_update_own on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- POSTS: anyone can read, owners can insert/delete
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_select_all'
  ) then
    create policy posts_select_all on public.posts for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_insert_own'
  ) then
    create policy posts_insert_own on public.posts for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_delete_own'
  ) then
    create policy posts_delete_own on public.posts for delete using (auth.uid() = user_id);
  end if;
end $$;

-- LIKES: users can manage their own likes
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='likes' and policyname='likes_select_all'
  ) then
    create policy likes_select_all on public.likes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='likes' and policyname='likes_insert_own'
  ) then
    create policy likes_insert_own on public.likes for insert with check (auth.uid() = from_user);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='likes' and policyname='likes_delete_own'
  ) then
    create policy likes_delete_own on public.likes for delete using (auth.uid() = from_user);
  end if;
end $$;

-- PHOTOS: anyone can read approved; owners can read/insert/update their own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_select_approved_or_mine'
  ) then
    create policy photos_select_approved_or_mine on public.photos
      for select using (status = 'approved' or auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_insert_own'
  ) then
    create policy photos_insert_own on public.photos
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_update_own'
  ) then
    create policy photos_update_own on public.photos
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- MATCHES: only participants can see/modify; allow insert when current user is a participant
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches_select_involving_me'
  ) then
    create policy matches_select_involving_me on public.matches
      for select using (auth.uid() = user_a or auth.uid() = user_b);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches_insert_involving_me'
  ) then
    create policy matches_insert_involving_me on public.matches
      for insert with check (auth.uid() = user_a or auth.uid() = user_b);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='matches' and policyname='matches_update_involving_me'
  ) then
    create policy matches_update_involving_me on public.matches
      for update using (auth.uid() = user_a or auth.uid() = user_b)
      with check (auth.uid() = user_a or auth.uid() = user_b);
  end if;
end $$;
