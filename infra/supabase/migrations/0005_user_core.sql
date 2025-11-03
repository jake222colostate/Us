-- Core profile/contact tables for production flows

-- Extend profiles with required attributes
alter table public.profiles
  add column if not exists email text,
  add column if not exists handle text,
  add column if not exists age int,
  add column if not exists gender text,
  add column if not exists location_text text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists interests text[] not null default '{}'::text[],
  add column if not exists is_active boolean not null default true,
  add column if not exists is_admin boolean not null default false;

-- ensure verification status is always populated
update public.profiles
   set verification_status = coalesce(nullif(verification_status, ''), 'unverified')
 where verification_status is null or verification_status = '';

-- hydrate email + handle from known data when missing
update public.profiles p
   set email = coalesce(p.email, u.email)
  from auth.users u
 where u.id = p.user_id
   and (p.email is null or p.email = '');

update public.profiles
   set handle = coalesce(nullif(handle, ''), username)
 where handle is null or handle = '';

create unique index if not exists idx_profiles_handle_unique on public.profiles(lower(handle));
create unique index if not exists idx_profiles_email_unique on public.profiles(lower(email))
  where email is not null;

-- Photos attached to a profile (stored in Supabase Storage)
create table if not exists public.user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  url text not null,
  storage_path text not null,
  is_primary boolean not null default false,
  is_verification_photo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_photos_user on public.user_photos(user_id, created_at desc);
create index if not exists idx_user_photos_primary on public.user_photos(user_id, is_primary) where is_primary;

alter table public.user_photos enable row level security;

create policy "user_photos_public_select"
  on public.user_photos
  for select
  using (
    -- everyone can view non-verification photos
    not is_verification_photo
    or auth.uid() = user_id
    or exists (
      select 1 from public.profiles prof
       where prof.user_id = auth.uid()
         and prof.is_admin
    )
  );

create policy "user_photos_manage_own"
  on public.user_photos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_photos_admin_update"
  on public.user_photos
  for update
  using (
    exists (
      select 1 from public.profiles prof
       where prof.user_id = auth.uid()
         and prof.is_admin
    )
  );

-- Verification submissions
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null check (type in ('photo', 'id')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  asset_paths text[] not null default '{}'::text[],
  asset_urls text[] not null default '{}'::text[],
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references public.profiles(user_id),
  reviewer_note text
);

create index if not exists idx_verifications_user on public.verifications(user_id, submitted_at desc);
create index if not exists idx_verifications_status on public.verifications(status, type);

alter table public.verifications enable row level security;

create policy "verifications_owner_select"
  on public.verifications
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles prof
       where prof.user_id = auth.uid()
         and prof.is_admin
    )
  );

create policy "verifications_owner_insert"
  on public.verifications
  for insert
  with check (auth.uid() = user_id);

create policy "verifications_owner_update"
  on public.verifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "verifications_admin_update"
  on public.verifications
  for update
  using (
    exists (
      select 1 from public.profiles prof
       where prof.user_id = auth.uid()
         and prof.is_admin
    )
  );

-- Likes between profiles
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(user_id) on delete cascade,
  to_user uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  is_superlike boolean not null default false,
  constraint likes_unique unique (from_user, to_user)
);

create index if not exists idx_likes_from on public.likes(from_user, created_at desc);
create index if not exists idx_likes_to on public.likes(to_user, created_at desc);

alter table public.likes enable row level security;

create policy "likes_owner_select"
  on public.likes
  for select
  using (auth.uid() = from_user or auth.uid() = to_user);

create policy "likes_owner_insert"
  on public.likes
  for insert
  with check (auth.uid() = from_user);

create policy "likes_owner_delete"
  on public.likes
  for delete
  using (auth.uid() = from_user);

-- Extend matches with mutual-like metadata
alter table public.matches
  add column if not exists matched_at timestamptz default now(),
  add column if not exists last_message_at timestamptz;

update public.matches
   set matched_at = coalesce(matched_at, created_at);

create index if not exists idx_matches_user_a on public.matches(user_a, matched_at desc);
create index if not exists idx_matches_user_b on public.matches(user_b, matched_at desc);

alter table public.matches enable row level security;

create policy "matches_participant_select"
  on public.matches
  for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_participant_insert"
  on public.matches
  for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_participant_update"
  on public.matches
  for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- profile verification helper
create or replace function public.touch_verification_status()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'verifications' then
    update public.profiles
       set verification_status = case
         when new.status = 'approved' then 'verified'
         when new.status = 'rejected' then 'rejected'
         else 'pending'
       end,
           updated_at = now()
     where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists verifications_touch_status on public.verifications;
create trigger verifications_touch_status
  after insert or update
  on public.verifications
  for each row
  execute procedure public.touch_verification_status();

-- Backfill photo URLs into the dedicated table for existing rows
insert into public.user_photos (user_id, url, storage_path, is_primary, created_at)
select p.user_id,
       url,
       url as storage_path,
       coalesce(array_position(p.photo_urls, url) = 1, false) as is_primary,
       p.updated_at
  from public.profiles p,
       unnest(coalesce(p.photo_urls, '{}'::text[])) with ordinality as photo(url, position)
 on conflict do nothing;

