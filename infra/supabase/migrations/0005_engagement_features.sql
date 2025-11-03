-- Profile unlocks and rewards system

alter table public.profiles
  add column if not exists verification_status text not null default 'none',
  add column if not exists visibility_score numeric not null default 1.0;

update public.profiles
  set visibility_score = 1.0
  where visibility_score is null;

do $$
begin
  alter table public.profiles
    add constraint profiles_verification_status_check
    check (verification_status in ('none', 'pending', 'approved', 'rejected'));
exception when duplicate_object then
  null;
end
$$;

create table if not exists public.profile_unlocks (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.profiles(user_id) on delete cascade,
  target_user_id uuid not null references public.profiles(user_id) on delete cascade,
  source text not null default 'payment',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_unlocks_unique unique (viewer_id, target_user_id)
);

alter table public.profile_unlocks enable row level security;

do $$
begin
  create policy "profile_unlocks_viewer_read"
    on public.profile_unlocks
    for select
    using (auth.uid() = viewer_id or auth.uid() = target_user_id);
exception when duplicate_object then
  null;
end
$$;

do $$
begin
  create policy "profile_unlocks_viewer_insert"
    on public.profile_unlocks
    for insert
    with check (auth.uid() = viewer_id);
exception when duplicate_object then
  null;
end
$$;

create table if not exists public.reward_spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  spin_type text not null check (spin_type in ('free', 'paid')),
  reward_type text not null,
  reward_value jsonb not null default '{}'::jsonb,
  spin_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.reward_spins enable row level security;

do $$
begin
  create policy "reward_spins_owner"
    on public.reward_spins
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then
  null;
end
$$;

create table if not exists public.user_bonuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  bonus_type text not null,
  quantity int not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_bonuses enable row level security;

do $$
begin
  create policy "user_bonuses_read"
    on public.user_bonuses
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then
  null;
end
$$;

do $$
begin
  create policy "user_bonuses_write"
    on public.user_bonuses
    for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then
  null;
end
$$;

do $$
begin
  create policy "user_bonuses_update"
    on public.user_bonuses
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then
  null;
end
$$;

create index if not exists idx_user_bonuses_user_id on public.user_bonuses(user_id);
create index if not exists idx_user_bonuses_expires on public.user_bonuses(expires_at);

create index if not exists idx_reward_spins_user_type on public.reward_spins(user_id, spin_type, spin_at desc);

create or replace function public.get_feed_interleaved(
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
  created_at timestamptz,
  has_boost boolean,
  visibility_score numeric
) as $$
  with viewer_location as (
    select location as geom from public.profiles where user_id = _viewer
  ),
  active_boosts as (
    select user_id, count(*) as boost_count
    from public.user_bonuses
    where bonus_type = 'boost'
      and (expires_at is null or expires_at > now())
    group by user_id
  ),
  candidate_posts as (
    select p.*, coalesce(ab.boost_count, 0) > 0 as has_boost, prof.visibility_score,
      row_number() over (partition by p.user_id order by p.created_at desc) as rn_user
    from public.posts p
    join public.profiles prof on prof.user_id = p.user_id
    left join public.blocks b on b.blocker = _viewer and b.blocked = p.user_id
    left join active_boosts ab on ab.user_id = p.user_id
    where b.blocked is null
      and (
        _radius_km is null
        or prof.location is null
        or coalesce((select geom from viewer_location limit 1), null) is null
        or st_dwithin(
          prof.location,
          (select geom from viewer_location limit 1),
          _radius_km * 1000
        )
      )
    order by p.created_at desc
    limit 500
  )
  select id, user_id, photo_url, caption, location, created_at, has_boost, visibility_score
  from candidate_posts
  order by (case when has_boost then 1 else 0 end) desc, visibility_score desc, created_at desc
  offset coalesce(_offset, 0)
  limit _limit;
$$ language sql stable;
