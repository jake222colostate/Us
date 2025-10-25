create extension if not exists postgis;
create extension if not exists pgcrypto;

create type heart_kind as enum ('normal', 'big');
create type purchase_provider as enum ('apple', 'google', 'stripe', 'dev');
create type purchase_status as enum ('succeeded', 'pending', 'failed', 'refunded');

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  birthdate date not null,
  gender text,
  looking_for text,
  photo_urls text[] default '{}',
  location geography(point, 4326),
  radius_km int default 25,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  photo_url text not null,
  caption text,
  location geography(point, 4326),
  created_at timestamptz default now()
);

create table if not exists hearts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  from_user uuid not null references profiles(user_id) on delete cascade,
  to_user uuid not null references profiles(user_id) on delete cascade,
  kind heart_kind default 'normal',
  paid boolean default false,
  message text,
  created_at timestamptz default now(),
  constraint hearts_unique unique (post_id, from_user)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(user_id) on delete cascade,
  user_b uuid not null references profiles(user_id) on delete cascade,
  created_at timestamptz default now(),
  constraint matches_unique unique (least(user_a,user_b), greatest(user_a,user_b))
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  expo_push_token text not null,
  platform text not null,
  created_at timestamptz default now()
);

create table if not exists blocks (
  blocker uuid not null references profiles(user_id) on delete cascade,
  blocked uuid not null references profiles(user_id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker, blocked)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references profiles(user_id) on delete cascade,
  reported_user uuid not null references profiles(user_id) on delete cascade,
  reason text not null,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  sku text not null,
  provider purchase_provider not null,
  provider_txn_id text,
  amount_cents int not null,
  currency text default 'USD',
  status purchase_status default 'succeeded',
  consumed_at timestamptz,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table posts enable row level security;
alter table hearts enable row level security;
alter table devices enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table purchases enable row level security;

create policy "profiles select" on profiles for select using (true);
create policy "profiles update own" on profiles for update using (auth.uid() = user_id);

create policy "posts select" on posts for select using (true);
create policy "posts insert own" on posts for insert with check (auth.uid() = user_id);
create policy "posts update own" on posts for update using (auth.uid() = user_id);
create policy "posts delete own" on posts for delete using (auth.uid() = user_id);

create policy "hearts insert own" on hearts for insert with check (auth.uid() = from_user);
create policy "hearts select all" on hearts for select using (true);

create policy "devices manage own" on devices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "blocks manage own" on blocks for all using (auth.uid() = blocker) with check (auth.uid() = blocker);
create policy "reports manage own" on reports for all using (auth.uid() = reporter) with check (auth.uid() = reporter);
create policy "purchases manage own" on purchases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function get_feed_interleaved(
  _viewer uuid,
  _limit int,
  _offset int,
  _radius_km int default 100
)
returns table (
  id uuid,
  user_id uuid,
  photo_url text,
  caption text,
  location geography(point, 4326),
  created_at timestamptz
) as $$
  with viewer_location as (
    select location as geom from profiles where user_id = _viewer
  ),
  candidate_posts as (
    select p.*,
      row_number() over (partition by p.user_id order by p.created_at desc) as rn_user
    from posts p
    join profiles prof on prof.user_id = p.user_id
    left join blocks b on b.blocker = _viewer and b.blocked = p.user_id
    where b.blocked is null
      and (
        _radius_km is null
        or prof.location is null
        or coalesce((select geom from viewer_location limit 1), NULL) is null
        or st_dwithin(
          prof.location,
          (select geom from viewer_location limit 1),
          _radius_km * 1000
        )
      )
    order by p.created_at desc
    limit 500
  )
  select id, user_id, photo_url, caption, location, created_at
  from candidate_posts
  order by rn_user, created_at desc
  offset coalesce(_offset, 0)
  limit _limit;
$$ language sql stable;
